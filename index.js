var i2c = require('i2c-bus'), //https://github.com/fivdi/i2c-bus
	i2c1 = i2c.openSync(1);

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

function lshift (num, bits) {
	return num * Math.pow(2,bits)
}

function rshift (num, bits) {
	return num / Math.pow(2,bits)
}

function readS16 (addr, cmd, little_endian) {
	var res = readU16(addr, cmd, little_endian)
	if (res > 32767)
		res -= 65536
	return res
}


function readU16 (addr, cmd, little_endian) {
	var res = i2c1.readWordSync (addr, cmd) & 0xFFFF;
	console.log ("readU16: " + res.toString(16));
	if (!little_endian) {
		res = ((res << 8) & 0xFFFF) + (res >> 8);
	}
	return res;
}

function readU8 (addr, cmd) {
	var res = i2c1.readByteSync (addr, cmd) & 0xFF;
	console.log ("readU8: " + res.toString(16));
	return res;
}

function read_raw (addr, cmd) {
	var raw = readU16 (addr, cmd, false);
	raw = raw << 8;
	raw = raw | readU8 (addr, cmd+2);
	raw = raw >> 4;
	console.log ("read_raw: " + raw.toString(16));
	return raw;
}

function load_calibration (from_datasheet) {
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
		cal_t1 = readU16 (BMP280_I2CADDR, BMP280_DIG_T1, true)  //# UINT16
		cal_t2 = readS16 (BMP280_I2CADDR, BMP280_DIG_T2, true)  //# INT16
		cal_t3 = readS16 (BMP280_I2CADDR, BMP280_DIG_T3, true)  //# INT16
		cal_p1 = readU16 (BMP280_I2CADDR, BMP280_DIG_P1, true)  //# UINT16
		cal_p2 = readS16 (BMP280_I2CADDR, BMP280_DIG_P2, true)  //# INT16
		cal_p3 = readS16 (BMP280_I2CADDR, BMP280_DIG_P3, true)  //# INT16
		cal_p4 = readS16 (BMP280_I2CADDR, BMP280_DIG_P4, true)  //# INT16
		cal_p5 = readS16 (BMP280_I2CADDR, BMP280_DIG_P5, true)  //# INT16
		cal_p6 = readS16 (BMP280_I2CADDR, BMP280_DIG_P6, true)  //# INT16
		cal_p7 = readS16 (BMP280_I2CADDR, BMP280_DIG_P7, true)  //# INT16
		cal_p8 = readS16 (BMP280_I2CADDR, BMP280_DIG_P8, true)  //# INT16
		cal_p9 = readS16 (BMP280_I2CADDR, BMP280_DIG_P9, true)  //# INT16
	}
	console.log ("calibration from " + (from_datasheet ? "datasheet" : "onboard"));
	console.log('T1 = '+(cal_t1))
	console.log('T2 = '+(cal_t2))
	console.log('T3 = '+(cal_t3))
	console.log('P1 = '+(cal_p1))
	console.log('P2 = '+(cal_p2))
	console.log('P3 = '+(cal_p3))
	console.log('P4 = '+(cal_p4))
	console.log('P5 = '+(cal_p5))
	console.log('P6 = '+(cal_p6))
	console.log('P7 = '+(cal_p7))
	console.log('P8 = '+(cal_p8))
	console.log('P9 = '+(cal_p9))
}

function compensate_temp (raw_temp) {
	var t1 = (((raw_temp >> 3) - (cal_t1 << 1)) * (cal_t2)) >> 11

	var t2 = (((((raw_temp >> 4) - (cal_t1)) *
			((raw_temp >> 4) - (cal_t1))) >> 12) *
		  (cal_t3)) >> 14

	return t1 + t2
}

function read_temp (addr) {
	var temp = read_raw (addr, BMP280_TEMPDATA);
	temp = compensate_temp (temp)
	temp = ((temp * 5 + 128) >> 8) / 100;
	console.log ("read_temp: " + temp);
	return temp;
}

function xread_pressure (addr) {
	var temp = compensate_temp (read_raw(addr, BMP280_TEMPDATA))
	var raw_pressure = read_raw(addr, BMP280_PRESSUREDATA)
	var p1 = temp - 128000
	var p2 = p1 * p1 * cal_p6
	p2 += (p1 * cal_p5) << 17
	p2 += cal_p4 << 35
	p1 = ((p1 * p1 * cal_p3) >> 8) + ((p1 * cal_p2) << 12)
	p1 = ((1 << 47) + p1) * (cal_p1) >> 33

	if (p1 == 0)
		return 0

	var p = 1048576 - raw_pressure
	p = (((p << 31) - p2) * 3125) / p1
	p1 = (cal_p9 * (p >> 13) * (p >> 13)) >> 25
	p2 = (cal_p8 * p) >> 19
	p = ((p + p1 + p2) >> 8) + ((cal_p7) << 4)
	
	return p/256
}

function read_pressure (addr) {
	var temp = compensate_temp (read_raw(addr, BMP280_TEMPDATA))
	var raw_pressure = read_raw(addr, BMP280_PRESSUREDATA)
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

console.log ("Running");

var devs = i2c1.scanSync();
console.log ("Devices: " + JSON.stringify (devs));

var t = read_temp (BMP280_I2CADDR);
console.log ("I think the temperature is " + t + "C");
console.log ("I think the temperature is " + (t*9/5 +32) + "F");

var p = read_pressure (BMP280_I2CADDR);
console.log ("I think the pressure is " + p/1000 + "kPa");
console.log ("I think the pressure is " + p/1000 * 0.2952998 + "inHg");

console.log ("calibrating...")
load_calibration (false)

var t = read_temp (BMP280_I2CADDR);
console.log ("I think the temperature is " + t + "C");
console.log ("I think the temperature is " + (t*9/5 +32) + "F");

var p = read_pressure (BMP280_I2CADDR);
console.log ("I think the pressure is " + p/1000 + "kPa");
console.log ("I think the pressure is " + p/1000 * 0.2952998 + "inHg");

console.log ("Done.");