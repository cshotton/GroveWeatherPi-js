// BMP280.js
/**
 * BMP280.js -  object for communicating with BMP280 devices
 * @module BMP280
 * @author cshotton
 */

const DEBUG = require ('debug');
const debug = DEBUG('bmp280');

const appRoot = require ('app-root-path');
const I2CDevice = require (appRoot + "/modules/i2cDevice");

const BMP280_I2CADDR = 0x77;
const BMP280_CHIPID = 0xD0;
//# BMP280 Registers
const BMP280_DIG_T1 = 0x88; //  # R   Unsigned Calibration data (16 bits)
const BMP280_DIG_T2 = 0x8A; //  # R   Signed Calibration data (16 bits)
const BMP280_DIG_T3 = 0x8C; //  # R   Signed Calibration data (16 bits)
const BMP280_DIG_P1 = 0x8E; //  # R   Unsigned Calibration data (16 bits)
const BMP280_DIG_P2 = 0x90; //  # R   Signed Calibration data (16 bits)
const BMP280_DIG_P3 = 0x92; //  # R   Signed Calibration data (16 bits)
const BMP280_DIG_P4 = 0x94; //  # R   Signed Calibration data (16 bits)
const BMP280_DIG_P5 = 0x96; //  # R   Signed Calibration data (16 bits)
const BMP280_DIG_P6 = 0x98; //  # R   Signed Calibration data (16 bits)
const BMP280_DIG_P7 = 0x9A; //  # R   Signed Calibration data (16 bits)
const BMP280_DIG_P8 = 0x9C; //  # R   Signed Calibration data (16 bits)
const BMP280_DIG_P9 = 0x9E; //  # R   Signed Calibration data (16 bits)

const BMP280_CONTROL = 0xF4; //
const BMP280_RESET = 0xE0; //
const BMP280_CONFIG = 0xF5; //
const BMP280_PRESSUREDATA = 0xF7; //
const BMP280_TEMPDATA = 0xFA; //

var cal_t1 = 27504
var cal_t2 = 26435
var cal_t3 = -1000
var cal_p1 = 36477
var cal_p2 = -10685
var cal_p3 = 3024
var cal_p4 = 2855
var cal_p5 = 140
var cal_p6 = -7
var cal_p7 = 15500
var cal_p8 = -14500
var cal_p9 = 6000

 /**
  * Object for managing BMP280 devices
  * @constructor
  * @param {string} bus - i2c-bus object for appropriate device bus 
  */
function BMP280 (bus) {
	if ( !(this instanceof BMP280) ) {
		return new BMP280 (bus);
	}
 	/*set instance vars here*/
 	this.device = new I2CDevice (bus, BMP280_I2CADDR);
} 	


function lshift (num, bits) {
	return num * Math.pow(2,bits)
}

function rshift (num, bits) {
	return num / Math.pow(2,bits)
}

function read_raw (that, cmd) {
	var raw = that.device.readU16 (cmd, false);
	raw = raw << 8;
	raw = raw | that.device.readU8 (cmd+2);
	raw = raw >> 4;
	debug ("read_raw: " + raw.toString(16));
	return raw;
}

function compensate_temp (raw_temp) {
	var t1 = (((raw_temp >> 3) - (cal_t1 << 1)) * (cal_t2)) >> 11

	var t2 = (((((raw_temp >> 4) - (cal_t1)) *
			((raw_temp >> 4) - (cal_t1))) >> 12) *
		  (cal_t3)) >> 14

	return t1 + t2
}

/**
* load calibration data from data sheet or chip
* @param {string} from_datasheet - true if datasheet values are to be used. from chip otherwise
*/
BMP280.prototype.load_calibration = function load_calibration (from_datasheet) {
	if (from_datasheet) {
		cal_t1 = 27504
		cal_t2 = 26435
		cal_t3 = -1000
		cal_p1 = 36477
		cal_p2 = -10685
		cal_p3 = 3024
		cal_p4 = 2855
		cal_p5 = 140
		cal_p6 = -7
		cal_p7 = 15500
		cal_p8 = -14500
		cal_p9 = 6000
	}
	else {
		cal_t1 = this.device.readU16 (BMP280_DIG_T1, true)  //# UINT16
		cal_t2 = this.device.readS16 (BMP280_DIG_T2, true)  //# INT16
		cal_t3 = this.device.readS16 (BMP280_DIG_T3, true)  //# INT16
		cal_p1 = this.device.readU16 (BMP280_DIG_P1, true)  //# UINT16
		cal_p2 = this.device.readS16 (BMP280_DIG_P2, true)  //# INT16
		cal_p3 = this.device.readS16 (BMP280_DIG_P3, true)  //# INT16
		cal_p4 = this.device.readS16 (BMP280_DIG_P4, true)  //# INT16
		cal_p5 = this.device.readS16 (BMP280_DIG_P5, true)  //# INT16
		cal_p6 = this.device.readS16 (BMP280_DIG_P6, true)  //# INT16
		cal_p7 = this.device.readS16 (BMP280_DIG_P7, true)  //# INT16
		cal_p8 = this.device.readS16 (BMP280_DIG_P8, true)  //# INT16
		cal_p9 = this.device.readS16 (BMP280_DIG_P9, true)  //# INT16
	}
	debug ("calibration from " + (from_datasheet ? "datasheet" : "onboard"));
	debug ('T1 = '+(cal_t1))
	debug ('T2 = '+(cal_t2))
	debug ('T3 = '+(cal_t3))
	debug ('P1 = '+(cal_p1))
	debug ('P2 = '+(cal_p2))
	debug ('P3 = '+(cal_p3))
	debug ('P4 = '+(cal_p4))
	debug ('P5 = '+(cal_p5))
	debug ('P6 = '+(cal_p6))
	debug ('P7 = '+(cal_p7))
	debug ('P8 = '+(cal_p8))
	debug ('P9 = '+(cal_p9))
}

/**
* synchronously read the temperature
* @returns {string} data - the data read
*/
BMP280.prototype.read_temp = function read_temp () {
	var temp = read_raw (this, BMP280_TEMPDATA);
	temp = compensate_temp (temp)
	temp = ((temp * 5 + 128) >> 8) / 100;
	debug ("read_temp: " + temp);
	return temp;
}

/**
* synchronously read the pressure
* @returns {string} data - the data read
*/
BMP280.prototype.read_pressure = function read_pressure () {
	var temp = compensate_temp (read_raw(this, BMP280_TEMPDATA))
	var raw_pressure = read_raw(this, BMP280_PRESSUREDATA)
	var p1 = temp - 128000
	var p2 = p1 * p1 * cal_p6
	p2 += lshift ((p1 * cal_p5), 17)
	p2 += lshift (cal_p4, 35)
	p1 = rshift((p1 * p1 * cal_p3), 8) + lshift((p1 * cal_p2), 12)
	p1 = rshift((lshift(1, 47) + p1) * cal_p1, 33)

	if (p1 == 0)
		return 0

	var p = 1048576 - raw_pressure
	p = ((lshift(p, 31) - p2) * 3125) / p1
	p1 = rshift(cal_p9 * rshift(p, 13) * rshift(p, 13), 25)
	p2 = rshift(cal_p8 * p, 19)
	p = rshift((p + p1 + p2), 8) + lshift((cal_p7), 4)
	
	return p/256
}

module.exports = BMP280;