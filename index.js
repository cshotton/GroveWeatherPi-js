const DEBUG = require ('debug');
const debug = DEBUG('main');

const appRoot = require ('app-root-path');
var i2c = require('i2c-bus'), //https://github.com/fivdi/i2c-bus
	i2c1 = i2c.openSync(1);

var BMP280 = require (appRoot + "/modules/BMP280");
var bmp280 = new BMP280 (i2c1);

debug ("Running");

var devs = i2c1.scanSync();
debug ("Devices: " + JSON.stringify (devs));

var t = bmp280.read_temp ();
debug ("I think the temperature is " + t + "C");
debug ("I think the temperature is " + (t*9/5 +32) + "F");

var p = bmp280.read_pressure ();
debug ("I think the pressure is " + p/1000 + " kPa");
debug ("I think the pressure is " + p/1000 * 0.2952998 + " inHg");

debug ("calibrating...")
bmp280.load_calibration (false)

var t = bmp280.read_temp ();
debug ("I think the temperature is " + t + "C");
debug ("I think the temperature is " + (t*9/5 +32) + "F");

var p = bmp280.read_pressure ();
debug ("I think the pressure is " + p/1000 + " kPa");
debug ("I think the pressure is " + p/1000 * 0.2952998 + " inHg");

var alt = bmp280.read_altitude();
debug ("Altitude is " + alt + " m");

var slp = bmp280.read_sealevel_pressure (alt);
debug ("Sea level pressure: " + slp + " Pa");

debug ("Done.");