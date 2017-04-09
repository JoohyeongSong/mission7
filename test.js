var express = require('express')
var app = express()
var fs = require('fs')

// Connect to mysql
var mysql = require('mysql')
var connection = mysql.createConnection({
	host : 'localhost',
	user : 'sensor2',
	password : 'power2350',
	database : 'capstone'
});

connection.connect();	

//To Write the current time.
var dateTime = require('node-datetime');

//To Get IP addr.
var os = require('os');
var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}

count=0; // the number of input temperature data after start server.

//Work with http call command
//Write the temperature record in local txt file and DB.
app.get('/', function(req,res){
	
	//Send the current time and temperature to Client.
	if(req.query.temp && typeof req.query.temp!='undefined'){

		var dt = dateTime.create();
		var formatted = dt.format('Y-m-d H:M:S');
		res.send(formatted+' Temp:'+req.query.temp);
		console.log(formatted+' Temp:'+req.query.temp);
	
		//Write to local TXT file.
		//fs.appendFile('LOG.txt', 'Datetime		temperature\n', function(err));
		fs.appendFile('LOG.txt',formatted + ' ' + req.query.temp+'\n', function(err){
			if(err) throw err;
		});
			
		data={};
		data.time = formatted;
		data.temperature = req.query.temp;
		//data.seq=count++;
		//data.type='T';		//Means 'Temperature'
		//data.device='102';	
		//data.unit='0';
		//data.ip=addresses;
		//data.value=formatted;
		//data.value=req.query.temp;
	
		//Insert data to DB by query 
		connection.query('INSERT INTO tempTable SET ?',data,function(err,rows,cols){
			if(err) throw err;
		
			console.log('Done Insert Query');	
		});
	}
	else{
		res.send('Unauthorized Access');
	}
})

//Work with dump command
//Show recent 1440(one day) temperature records.
app.get('/dump',function(req,res){

	//Get Recent data from DB by query
	connection.query('SELECT * from tempTable',function(err,rows,cols){
		if(err) throw err;
		
		res.write('<html><head><title>Seminar room Temperature</title></head><body>');		
		res.write('<p><h1>Measure Temperature @ AS 908, Sogang Univ.</h1></p>');
		res.write('<p>Made By jhsong</p>');	
		
		var dt = dateTime.create();
		var formatted = dt.format('Y-m-d H:M:S');
		res.write('<p>Dump '+rows.length+' data at '+formatted+'</p>');
		
		//Send HTML table
		res.write('<table border="1">');
		res.write('<tr><th>Seq.</th><th>Time</th><th>Temp</th></tr>');
		for(var i=0;i<rows.length;i++){
			var row=rows[i];
			res.write('<tr>');
			res.write('<td>'+i+'</td><td>'+row.time+'</td><td>'+row.temperature+'</td>');
			res.write('</tr>');
		}	
		res.end('</table></body></html>');
		console.log('Dump Complete');
	});
})

app.listen(8000, function(){
	console.log('Temperature Measuring Program listening on port 3000!')
})
