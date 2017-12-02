/*
 * hbb-tv-pp
 *
 * By: Alexander Terczka
 *
 */

var express = require('express');
var httpProxy = require('http-proxy');
var http = require('http');
var fs = require('fs');

var scanner_mode=true;
var transparent_mode=false;

var listen="0.0.0.0";
var port="8000";
var blockfile=false;


var proxy=httpProxy.createProxyServer();

proxy.on('error', function(e) {
  console.log("Proxy Error "+e);
});

var app=express();

function dump(o)
{
    var right="";
    for(var i in o) 
    {
	if (typeof o[i]==='function') right='function';
	else right=o[i];
	console.log(i+" -> "+right);
    }
}

var whitelist=["etag","Location","Content-Type","Server","P3P","Set-Cookie","Date","Cache-Control"];
var blacklist=["Content-length","x-powered-by","x-aspnet-version","x-boost-status"];

if (typeof String.prototype.isCaseEqual!= 'function') {
    String.prototype.isCaseEqual = function (str){
        return this.toUpperCase()==str.toUpperCase();
     };
}

function filter_headers(input)
{
    var output={};
    for (var att in input)
    {
	for(var i=0;i<whitelist.length;i++)
	{ 
	    if(att.isCaseEqual(whitelist[i])) { output[att]=input[att]; break; }
	}
	if (i<whitelist.length) continue;
	for(var i=0;i<blacklist.length;i++)
	{ 
	    if(att.isCaseEqual(blacklist[i])) { break; }
	}
	if (i<blacklist.length) continue;
	console.log("Unknown Header: "+att+" "+input[att]);
    }
    return output;
}

function filter_body(buffer)
{
    return buffer;
}

function logger(req,res,next)
{
    var d=new Date();
    console.log("Log: "+d+" "+req.method+" "+req.protocol+"://"+req.hostname+req.originalUrl);
    next();
}

var blocklist=[];

function scanner(req,res,next) 
{
   
    if (transparent_mode) next();
    if (req.query.mode=="scanner") scanner_mode=true;
    if (req.query.mode=="proxy") scanner_mode=false;

    if (scanner_mode)   	// in scannermode
			    	// all traffic from TV set is covered and recorded
    {
	console.log("sending scannerpage");
        res.setHeader('Cache-Control', 'private'); // 4 days
        res.setHeader('Expires', new Date(Date.now()).toUTCString());
	res.render("scannerpage.ejs");
	if(req.method=="GET")
	{
	    if (blocklist.indexOf(req.hostname+req.originalUrl)<0)
	    {
		blocklist.push(req.hostname+req.originalUrl);
		console.log("Filter added: "+req.hostname+req.originalUrl);
		write_blocklist();
	    }
	}
	return; 
    }
    if (req.method=="GET" || req.method=="HEAD")
    {
	if (blocklist.indexOf(req.hostname+req.originalUrl)>=0)
				// in standard mode
	{
            res.setHeader('Cache-Control', 'private'); // 4 days
            res.setHeader('Expires', new Date(Date.now()).toUTCString());
	    res.render("proxypage.ejs");
	    return;
	}
    }
    next();
}

var file_counter=1;

function save_file(buf,word)
{
    if (word) buf=word+"\n"+buf;
    fs.writeFile("cache/"+process.pid+"-"+file_counter,buf,function(err)
    {
	if (err) { console.log(err); }
    });
    file_counter++;
}

function write_blocklist()
{
    if (!blockfile) return; 
    fs.writeFile(blockfile,JSON.stringify(blocklist),function (err) {
	if(err) console.log("Writing blocklist file failed "+err);
    });
}

app.use(logger);
app.use(scanner);
app.use(function(req,res) {
   console.log("Fall through proxy "+req.hostname+req.originalUrl);
   proxy.web(req, res, {target:"http://"+req.hostname});
});

opt=require('node-getopt').create([
	["l","bindaddress=ARG","Listen to this IP"],
	["p","port=ARG","Listen to this TCP Port (8000)"],
	["b","blocklist=ARG","File with Blocklist URLs (Load and Save)"],
	["m","mode=ARG","mode at startup: 0=transparent, 1=scanner, 2=privacyproxy (needs -b)"],
	['h','help','display this help']
]).bindHelp().parseSystem();

if (opt.options.bindaddress) listen=opt.options.bindaddress;
if (opt.options.port) port=opt.options.port;
if (opt.options.blocklist) blockfile=opt.options.blocklist;
if (opt.options.mode) 
{
   if (opt.options.mode==0) transparent_mode=true;
   else if (opt.options.mode==2) scanner_mode=false;
}

if (blockfile) fs.readFile(blockfile,"utf8",function(err,data) {
    if(err) { 
	console.log("Can't open Blocklist File "+err);
	console.log("Will write a new blocklist file");
	write_blocklist();
    }
    else
    {
	blocklist=JSON.parse(data);
    }
});


var server = app.listen(port,listen, function() {
    console.log('Listening on port %s:%d', server.address().address, server.address().port);
});

