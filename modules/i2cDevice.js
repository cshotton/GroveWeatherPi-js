//i2cDevice.js
/**
 * i2cDevice.js - standard object for communicating with I2C devices
 * @module i2cDevice
 * @author cshotton
 */

const DEBUG = require ('debug');
const debug = DEBUG('i2cdevice');

/**
* Collection of device level I2C functions
* @constructor
*/
function i2cDevice (bus, address) {
	if ( !(this instanceof i2cDevice) ) {
		return new i2cDevice (bus, address);
	}
 	/*set instance vars here*/
 	this.bus = bus;
 	this.address = address;
} 	

/**
* synchronously read a signed 16 bit value
* @param {string} cmd - i2c command register to read
* @param {string} little_endian - flag indicating little vs big endian byte ordering
* @returns {string} data - the data read
*/
i2cDevice.prototype.readS16 = function readS16 (cmd, little_endian) {
	var res = this.readU16(cmd, little_endian)
	if (res > 32767)
		res -= 65536
	debug ("readS16: " + res.toString(16));
	return res
}

/**
* synchronously read an unsigned 16 bit value
* @param {string} cmd - i2c command register to read
* @param {string} little_endian - flag indicating little vs big endian byte ordering
* @returns {string} data - the data read
*/
i2cDevice.prototype.readU16 = function readU16 (cmd, little_endian) {
	var res = this.bus.readWordSync (this.address, cmd) & 0xFFFF;
	if (!little_endian) {
		res = ((res << 8) & 0xFFFF) + (res >> 8);
	}
	debug ("readU16: " + res.toString(16));
	return res;
}

/**
* synchronously read an unsigned byte value
* @param {string} cmd - i2c command register to read
* @returns {string} data - the data read
*/
i2cDevice.prototype.readU8 = function readU8 (cmd) {
	var res = this.bus.readByteSync (this.addr, cmd) & 0xFF;
	debug ("readU8: " + res.toString(16));
	return res;
}

module.exports = i2cDevice;