// imports
const express = require('express');
const app = express();
const bodyParser = require('body-parser');


// inicializamos la conexion con firebase
// necesitamos json con las credenciales 
var admin = require('firebase-admin');
//////var serviceAccount = require('./notifications.json');
var serviceAccount = require('./chat.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://chat-4d06f.firebaseio.com"
});

var db = admin.database();
var ref1 = db.ref("/Chat/Conversacion");
var ref2 = db.ref("/Chat/Usuarios");

var listaConversacion = new Map();
var listaUsuarios = new Map();

ref2.on("value", function(snapshot) {
    console.log("Empezamos a leer Usuarios");
    
    snapshot.forEach(function(childSnapshot) {
        var usuario = childSnapshot.key;
        var token = childSnapshot.val().token;
        var online = childSnapshot.val().online;
        var valores = [token, online];
        listaUsuarios.set(usuario,valores);
        //console.log(usuario+" -- "+token+" -- "+online);
    });
    
}, function(errorObject) {
    console.log("The read failed: " + errorObject.code);
});



ref1.on("value", function(snapshot) {
    console.log("Empezamos a leer Conversacion");
    
    snapshot.forEach(function(childSnapshot) {
        var usuarios = childSnapshot.key;
        var fecha = childSnapshot.val().fecha;
        var fechaCompleta = fecha.date+"/"+fecha.month+"/"+fecha.year
            +", "+fecha.hours+":"+fecha.minutes+":"+fecha.seconds
        var mensaje = childSnapshot.val().mensaje;
        listaConversacion.set(usuarios,mensaje);
        //console.log(usuarios+" -- "+fechaCompleta+" -- "+mensaje);
    });
    
    console.log("TRABAJAMOS CON LOS DATOS");
    listaUsuarios.forEach(function(valor, clave) {
        var usuario = clave;
        var token = valor[0];
        var online = valor[1];
        listaConversacion.forEach(function(valor, clave) {
            var usuarios = clave.split(";");
            var envia = usuarios[0];
            var recibe = usuarios[1];
            var mensaje = valor;
            if (usuario.toUpperCase() === recibe.toUpperCase()){
                if (online==false){
                    var message = {
                        data:{
                            msg: mensaje
                        },
                        token: token,
                        notification:{
                            title : 'Ha recibido un mensaje',
                            body : mensaje
                        }
                    };
    
                    admin.messaging().send(message)
                        .then((response) => {
                        // Response is a message ID string.
                        console.log('Successfully sent message:', response);
                        })
                        .catch((error) => {
                        console.log('Error sending message:', error);
                    });
                }
            }
            console.log(usuario+" - "+envia+" - "+recibe+" - "+mensaje);
        });

    });
    
}, function(errorObject) {
    console.log("The read failed: " + errorObject.code);
});

var server = app.listen(8080, () => {
    console.log('Servidor web iniciado');
});