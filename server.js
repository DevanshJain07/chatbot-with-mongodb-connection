const mongo = require('mongodb').MongoClient;
const socketClient = require('socket.io').listen(4000).sockets;

const dbname = 'chatbot'

// Connect to mongo
mongo.connect('mongodb://127.0.0.1/' + dbname, function (err, client) {
if (err) {
throw err;
}
var db = client.db(dbname);

console.log('MongoDB connected...');

// Connect to Socket.io
socketClient.on('connection', function (socket) {
    let chat = db.collection('chats');

    // Create function to send status
    sendStatus = function (s) {
        socket.emit('status', s);
    }

    // Get chats from mongo collection
    chat.find().limit(100).sort({ _id: 1 }).toArray(function (err, res) {
        if (err) {
            throw err;
        }

        // Emit the messages
        socket.emit('output', res);
    });

    // Handle input events
    socket.on('input', function (data) {
        let name = data.name;
        let message = data.message;

        // Check for name and message
        if (name == '' || message == '') {
            // Send error status
            sendStatus('Please enter a name and message');
        } else {
            // Insert message
            chat.insert({ name: name, message: message }, function () {
                socketClient.emit('output', [data]);

                // Send status object
                sendStatus({
                    message: 'Message sent',
                    clear: true
                });
            });
        }
    });

    // Handle clear
    socket.on('clear', function (data) {
        // Remove all chats from collection
        chat.remove({}, function () {
            // Emit cleared
            socket.emit('cleared');
        });
    });
});
});