const Likes = require('../models/likes');
const async = require('async');
const https = require('https');

exports.getController = function (req, res, next) {
    if (typeof req.query.stock === 'string') {
        req.query.stock = [req.query.stock];
    }

    const stockData = [];

    for (stock of req.query.stock) {
        stockData.push(async.parallel({
            stockData: function(callback) {
                https.get('https://repeated-alpaca.glitch.me/v1/stock/' + stock + '/quote', (resp) => {
                    let data = '';
                    // A chunk of data has been recieved.
                    resp.on('data', (chunk) => {
                        data += chunk;
                    });
                    // The whole response has been received. Print out the result.
                    resp.on('end', () => {
                        data = JSON.parse(data);
                        callback(null, data);
                    }).on("error", (err) => {
                        console.log("Error: " + err.message);
                    });
                });
            },
            likesData: function(callback) {
                Likes.findOne({stock: stock}, (err, doc) => {
                    if (err) console.log(err);
                    if (doc) {
                        if (req.query.likes) {
                            if (doc.IPs.some((val) => val === req.ip)) callback(null, doc.likes);
                            doc.IPs.push(ip);
                            doc.likes++;
                            doc.save((err) => {
                                if (err) console.log(err);
                            });
                        }
                        callback(null, doc.likes);
                    } else {
                        if (req.query.likes) {
                            const doc = new Likes({
                                stock: stock,
                                likes: 1,
                                IPs: [req.ip]
                            });
                            doc.save((err) => {
                                if (err) console.log(err);
                            });
                        }
                        callback(null, req.query.likes? 1 : 0);
                    }
                });
            }
        }));
    }

    Promise.all(stockData).then(function(results) {
        const stockResults = [];
        for (result of results) {
            stockResults.push({
                'stock': result.stockData.symbol,
                'price': result.stockData.latestPrice,
                'likes': result.likesData
            });
        }
        if (stockResults.length === 1) {
            res.json({stockData: stockResults[0]});
        } else {
            res.json({stockData: [
                {stock: stockResults[0].stock, price: stockResults[0].price, rel_likes: stockResults[0].likes - stockResults[1].likes},
                {stock: stockResults[1].stock, price: stockResults[1].price, rel_likes: stockResults[1].likes - stockResults[0].likes}
            ]});
        }
    }).catch((err) => console.log(err));

    
    
};