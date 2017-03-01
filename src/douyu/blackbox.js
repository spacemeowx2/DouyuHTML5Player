'use strict'

const table = [0xe6, 0x92, 0x4c, 0xc6, 0xbd, 0xd, 0xb3, 0xb1, 0xf6, 0x64, 0x50, 0x3d, 0xdc, 0xf4, 0xea, 0xbc, 0xa2, 0x68, 0x8, 0xcf, 0x8b, 0x9, 0x8f, 0x6b, 0x17, 0xd0, 0x9c, 0x5b, 0xb, 0x7d, 0x1, 0x6d, 0x4f, 0x9a, 0x47, 0xe5, 0x52, 0xb4, 0x25, 0x2d, 0x57, 0xf2, 0x3f, 0x86, 0xac, 0xbf, 0x78, 0x16, 0xd3, 0xc1, 0x2e, 0xff, 0xb7, 0x26, 0xdf, 0x5c, 0x39, 0xeb, 0xa0, 0xb0, 0xb2, 0x53, 0x2f, 0xe7, 0x7c, 0xf3, 0x3e, 0x4a, 0x84, 0xd6, 0xc4, 0x5e, 0xab, 0xf1, 0x5f, 0xaf, 0x95, 0xd4, 0x6a, 0xfd, 0x10, 0xfc, 0x9f, 0xc0, 0x7a, 0x4, 0xfa, 0xa5, 0x1f, 0x1d, 0xc5, 0x1a, 0x23, 0x4e, 0x9d, 0xd5, 0x70, 0x90, 0x85, 0xe2, 0x76, 0x43, 0x20, 0x2c, 0x0, 0x45, 0xd1, 0x13, 0x28, 0xdd, 0xde, 0x33, 0xd2, 0xb9, 0xf7, 0x87, 0xf5, 0xbb, 0x9e, 0x65, 0xa4, 0xae, 0x93, 0xa1, 0x98, 0x2, 0xf, 0x58, 0x7, 0xa8, 0xdb, 0x2b, 0xc, 0x79, 0x88, 0x6, 0x62, 0x97, 0x42, 0x91, 0x9b, 0x82, 0x22, 0x5d, 0xcc, 0x8e, 0x75, 0x5a, 0xc8, 0x83, 0xca, 0xef, 0x8d, 0x31, 0x99, 0x8c, 0x18, 0x19, 0x74, 0xe1, 0x35, 0xcd, 0x24, 0x69, 0xda, 0x48, 0x6e, 0xc2, 0x15, 0xc7, 0x11, 0x21, 0x63, 0x38, 0x46, 0x5, 0x71, 0xe, 0x59, 0x36, 0x94, 0x81, 0xb8, 0x7e, 0x89, 0xbe, 0x3a, 0xee, 0xa3, 0x7b, 0x1e, 0xe0, 0xe8, 0x41, 0x66, 0xd9, 0x51, 0x14, 0x67, 0xb5, 0x6c, 0x3c, 0x34, 0x3b, 0xba, 0xc9, 0x4b, 0xa7, 0x49, 0xaa, 0xf9, 0x37, 0x30, 0x2a, 0x72, 0xe4, 0xa9, 0x96, 0xcb, 0x27, 0xce, 0xc3, 0x55, 0xad, 0x4d, 0x32, 0x54, 0xfb, 0xd7, 0xa, 0x61, 0x80, 0x77, 0x73, 0xd8, 0x8a, 0xb6, 0xe3, 0xfe, 0xe9, 0x1b, 0x29, 0xec, 0x56, 0x12, 0x60, 0xf0, 0xa6, 0xf8, 0xed, 0x7f, 0x44, 0x40, 0x1c, 0x6f, 0x3]

export function stupidMD5 (s) {
    let mid = md5(s)
    mid = mid.split(/(..)/).filter(x=>x!="").map(x=>parseInt(x,16))
    F_func_173e8124cdbdc90d(Array.from(s).map(i => i.charCodeAt(0)), mid)
    let ret = mid.map(i => ('0' + i.toString(16)).substr(-2, 2)).join('')
    return ret
}
// 163, 215
// 163 ^ 0x45, 215 ^ 0x36
function F_func_173e8124cdbdc90d (key, s) {
    let locTable = []
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 256; j++) {
            locTable.push(table[j ^ key[i]] ^ 0x45)
        }
    }
    // console.log(locTable.slice(256, 512).join(' '))
    let len = s.length
    if (len >= 8) {
        let i = 0
        let j = len >>> 3
        do
        {
            // console.log(s, i)
            F_func_5601962242a657f3(s, i, locTable)
            i = i + 8
            j = j - 1
        }
        while(j != 0)
    }
    // 剩余的和key异或
    let pad = len % 8
    if (pad != 0) {
        const base = len >> 3
        while (pad > 0) {
            s[base + pad] ^= key[pad]
            pad--
        }
    }
}
  /*
  * Add integers, wrapping at 2^32. This uses 16-bit operations internally
  * to work around bugs in some JS interpreters.
  */
  function safeAdd (x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF)
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xFFFF)
  }

  /*
  * Bitwise rotate a 32-bit number to the left.
  */
  function bitRotateLeft (num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt))
  }

  /*
  * These functions implement the four basic operations the algorithm uses.
  */
  function md5cmn (q, a, b, x, s, t) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b) // 傻逼斗鱼
  }
  function md5ff (a, b, c, d, x, s, t) {
    return md5cmn((b & c) | ((~b) & d), a, b, x, s, t + 1)
  }
  function md5gg (a, b, c, d, x, s, t) {
    return md5cmn((b & d) | (c & (~d)), a, b, x, s, t - 1)
  }
  function md5hh (a, b, c, d, x, s, t) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t + 1)
  }
  function md5ii (a, b, c, d, x, s, t) {
    return md5cmn(c ^ (b | (~d)), a, b, x, s, t - 1)
  }

  /*
  * Calculate the MD5 of an array of little-endian words, and a bit length.
  */
  function binlMD5 (x, len) {
    /* append padding */
    x[len >> 5] |= 0x80 << (len % 32)
    x[(((len + 64) >>> 9) << 4) + 14] = len

    var i
    var olda
    var oldb
    var oldc
    var oldd
    var a = 1732584193
    var b = -271733879
    var c = -1732584194
    var d = 271733878

    for (i = 0; i < x.length; i += 16) {
      olda = a
      oldb = b
      oldc = c
      oldd = d

      a = md5ff(a, b, c, d, x[i], 7, -680876936)
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)

      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
      b = md5gg(b, c, d, a, x[i], 20, -373897302)
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)

      a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
      d = md5hh(d, a, b, c, x[i], 11, -358537222)
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)

      a = md5ii(a, b, c, d, x[i], 6, -198630844)
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)

      a = safeAdd(a, olda)
      b = safeAdd(b, oldb)
      c = safeAdd(c, oldc)
      d = safeAdd(d, oldd)
    }
    return [a, b, c, d]
  }

  /*
  * Convert an array of little-endian words to a string
  */
  function binl2rstr (input) {
    var i
    var output = ''
    var length32 = input.length * 32
    for (i = 0; i < length32; i += 8) {
      output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF)
    }
    return output
  }

  /*
  * Convert a raw string to an array of little-endian words
  * Characters >255 have their high-byte silently ignored.
  */
  function rstr2binl (input) {
    var i
    var output = []
    output[(input.length >> 2) - 1] = undefined
    for (i = 0; i < output.length; i += 1) {
      output[i] = 0
    }
    var length8 = input.length * 8
    for (i = 0; i < length8; i += 8) {
      output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32)
    }
    return output
  }

  /*
  * Calculate the MD5 of a raw string
  */
  function rstrMD5 (s) {
    return binl2rstr(binlMD5(rstr2binl(s), s.length * 8))
  }

  /*
  * Calculate the HMAC-MD5, of a key and some data (raw strings)
  */
  function rstrHMACMD5 (key, data) {
    var i
    var bkey = rstr2binl(key)
    var ipad = []
    var opad = []
    var hash
    ipad[15] = opad[15] = undefined
    if (bkey.length > 16) {
      bkey = binlMD5(bkey, key.length * 8)
    }
    for (i = 0; i < 16; i += 1) {
      ipad[i] = bkey[i] ^ 0x36363636
      opad[i] = bkey[i] ^ 0x5C5C5C5C
    }
    hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
    return binl2rstr(binlMD5(opad.concat(hash), 512 + 128))
  }

  /*
  * Convert a raw string to a hex string
  */
  function rstr2hex (input) {
    var hexTab = '0123456789abcdef'
    var output = ''
    var x
    var i
    for (i = 0; i < input.length; i += 1) {
      x = input.charCodeAt(i)
      output += hexTab.charAt((x >>> 4) & 0x0F) +
      hexTab.charAt(x & 0x0F)
    }
    return output
  }

  /*
  * Encode a string as utf-8
  */
  function str2rstrUTF8 (input) {
    return unescape(encodeURIComponent(input))
  }

  /*
  * Take string arguments and return either raw or hex encoded strings
  */
  function rawMD5 (s) {
    return rstrMD5(str2rstrUTF8(s))
  }
  function hexMD5 (s) {
    return rstr2hex(rawMD5(s))
  }
  function rawHMACMD5 (k, d) {
    return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d))
  }
  function hexHMACMD5 (k, d) {
    return rstr2hex(rawHMACMD5(k, d))
  }

  function md5 (string, key, raw) {
    if (!key) {
      if (!raw) {
        return hexMD5(string)
      }
      return rawMD5(string)
    }
    if (!raw) {
      return hexHMACMD5(key, string)
    }
    return rawHMACMD5(key, string)
  }


function F_func_5601962242a657f3(str, index, table)
{
    function si8 (val, pos) {
        if (pos >= 100) {
            throw new Error('impossible')
        }
        str[index + pos] = val & 0xFF
    }
    function li8 (pos) {
        if (pos >= 100) {
            return table[pos - 100]
        } else {
            return str[index + pos]
        }
    }
    function int (v) {
        return v
    }
    // method body index: 983 method index: 1105
    var src = 0;
    var _loc3_ = 0;
    var _loc5_ = 0;
    var tab = 0;
    var _loc9_ = 0;
    var _loc11_ = 0;
    var _loc13_ = 0;
    var _loc15_ = 0;
    var _loc17_ = 0;
    var _loc19_ = 0;
    var _loc6_ = 0;
    var _loc4_ = 0;
    var _loc10_ = 0;
    var _loc8_ = 0;
    var _loc14_ = 0;
    var _loc12_ = 0;
    var _loc18_ = 0;
    var _loc16_ = 0;
    var _loc21_ = 0;
    var _loc20_ = 0;
    tab = 100;
    src = 0;
    var dest = 0;
    _loc3_ = li8(src + 1);
    _loc5_ = li8(src);
    _loc5_ = _loc5_ << 8;
    _loc5_ = _loc5_ | _loc3_;
    _loc3_ = int(tab + _loc3_);
    _loc3_ = li8(_loc3_);
    _loc3_ = _loc3_ << 8;
    _loc5_ = _loc3_ ^ _loc5_;
    _loc3_ = int(_loc5_ >>> 8);
    _loc9_ = int(tab + 256);
    _loc3_ = int(_loc9_ + _loc3_);
    _loc3_ = li8(_loc3_);
    _loc5_ = _loc5_ ^ _loc3_;
    _loc11_ = _loc5_ & 255;
    _loc3_ = int(tab + 512);
    _loc11_ = int(_loc3_ + _loc11_);
    _loc11_ = li8(_loc11_);
    _loc11_ = _loc11_ << 8;
    _loc11_ = _loc11_ ^ _loc5_;
    _loc13_ = int(_loc11_ >>> 8);
    _loc5_ = int(tab + 768);
    _loc13_ = int(_loc5_ + _loc13_);
    _loc13_ = li8(_loc13_);
    _loc15_ = _loc11_ ^ _loc13_;
    _loc11_ = li8(src + 7);
    _loc13_ = li8(src + 6);
    _loc13_ = _loc13_ << 8;
    _loc11_ = _loc13_ | _loc11_;
    _loc11_ = _loc11_ ^ _loc15_;
    _loc11_ = _loc11_ ^ 1;
    _loc13_ = _loc11_ & 255;
    _loc17_ = int(tab + 1024);
    _loc13_ = int(_loc17_ + _loc13_);
    _loc13_ = li8(_loc13_);
    _loc13_ = _loc13_ << 8;
    _loc11_ = _loc11_ ^ _loc13_;
    _loc13_ = int(_loc11_ >>> 8);
    _loc19_ = int(tab + 1280);
    _loc13_ = int(_loc19_ + _loc13_);
    _loc13_ = li8(_loc13_);
    _loc11_ = _loc11_ ^ _loc13_;
    _loc6_ = _loc11_ & 255;
    _loc13_ = int(tab + 1536);
    _loc6_ = int(_loc13_ + _loc6_);
    _loc6_ = li8(_loc6_);
    _loc6_ = _loc6_ << 8;
    _loc6_ = _loc11_ ^ _loc6_;
    _loc4_ = int(_loc6_ >>> 8);
    _loc11_ = int(tab + 1792);
    _loc4_ = int(_loc11_ + _loc4_);
    _loc4_ = li8(_loc4_);
    _loc10_ = _loc6_ ^ _loc4_;
    _loc6_ = li8(src + 5);
    _loc4_ = li8(src + 4);
    _loc4_ = _loc4_ << 8;
    _loc6_ = _loc4_ | _loc6_;
    _loc6_ = _loc6_ ^ _loc10_;
    _loc6_ = _loc6_ ^ 2;
    _loc8_ = _loc6_ & 255;
    _loc4_ = int(tab + 2048);
    _loc8_ = int(_loc4_ + _loc8_);
    _loc8_ = li8(_loc8_);
    _loc8_ = _loc8_ << 8;
    _loc8_ = _loc6_ ^ _loc8_;
    _loc14_ = int(_loc8_ >>> 8);
    _loc6_ = int(tab + 2304);
    _loc14_ = int(_loc6_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc8_ = _loc8_ ^ _loc14_;
    _loc14_ = _loc8_ & 255;
    _loc14_ = int(tab + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc8_ = _loc8_ ^ _loc14_;
    _loc14_ = int(_loc8_ >>> 8);
    _loc14_ = int(_loc9_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc8_ = _loc8_ ^ _loc14_;
    _loc14_ = li8(src + 3);
    src = li8(src + 2);
    src = src << 8;
    src = src | _loc14_;
    src = src ^ _loc8_;
    src = src ^ 3;
    _loc14_ = src & 255;
    _loc14_ = int(_loc3_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    src = src ^ _loc14_;
    _loc14_ = int(src >>> 8);
    _loc14_ = int(_loc5_ + _loc14_);
    _loc14_ = li8(_loc14_);
    src = src ^ _loc14_;
    _loc14_ = src & 255;
    _loc14_ = int(_loc17_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    src = src ^ _loc14_;
    _loc14_ = int(src >>> 8);
    _loc14_ = int(_loc19_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = src ^ _loc14_;
    _loc15_ = _loc15_ ^ _loc14_;
    _loc15_ = _loc15_ ^ 4;
    src = _loc15_ & 255;
    src = int(_loc13_ + src);
    src = li8(src);
    src = src << 8;
    _loc15_ = _loc15_ ^ src;
    src = int(_loc15_ >>> 8);
    src = int(_loc11_ + src);
    src = li8(src);
    _loc15_ = _loc15_ ^ src;
    src = _loc15_ & 255;
    src = int(_loc4_ + src);
    src = li8(src);
    src = src << 8;
    _loc15_ = _loc15_ ^ src;
    src = int(_loc15_ >>> 8);
    src = int(_loc6_ + src);
    src = li8(src);
    _loc15_ = _loc15_ ^ src;
    src = _loc10_ ^ _loc15_;
    src = src ^ 5;
    _loc10_ = src & 255;
    _loc10_ = int(tab + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc10_ = _loc10_ << 8;
    src = src ^ _loc10_;
    _loc10_ = int(src >>> 8);
    _loc10_ = int(_loc9_ + _loc10_);
    _loc10_ = li8(_loc10_);
    src = src ^ _loc10_;
    _loc10_ = src & 255;
    _loc10_ = int(_loc3_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc10_ = _loc10_ << 8;
    src = src ^ _loc10_;
    _loc10_ = int(src >>> 8);
    _loc10_ = int(_loc5_ + _loc10_);
    _loc10_ = li8(_loc10_);
    src = src ^ _loc10_;
    _loc10_ = _loc8_ ^ src;
    _loc10_ = _loc10_ ^ 6;
    _loc8_ = _loc10_ & 255;
    _loc8_ = int(_loc17_ + _loc8_);
    _loc8_ = li8(_loc8_);
    _loc8_ = _loc8_ << 8;
    _loc10_ = _loc10_ ^ _loc8_;
    _loc8_ = int(_loc10_ >>> 8);
    _loc8_ = int(_loc19_ + _loc8_);
    _loc8_ = li8(_loc8_);
    _loc10_ = _loc10_ ^ _loc8_;
    _loc8_ = _loc10_ & 255;
    _loc8_ = int(_loc13_ + _loc8_);
    _loc8_ = li8(_loc8_);
    _loc8_ = _loc8_ << 8;
    _loc10_ = _loc10_ ^ _loc8_;
    _loc8_ = int(_loc10_ >>> 8);
    _loc8_ = int(_loc11_ + _loc8_);
    _loc8_ = li8(_loc8_);
    _loc8_ = _loc10_ ^ _loc8_;
    _loc10_ = _loc14_ ^ _loc8_;
    _loc10_ = _loc10_ ^ 7;
    _loc14_ = _loc10_ & 255;
    _loc14_ = int(_loc4_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = int(_loc10_ >>> 8);
    _loc14_ = int(_loc6_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = _loc10_ & 255;
    _loc14_ = int(tab + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = int(_loc10_ >>> 8);
    _loc14_ = int(_loc9_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc15_ ^ _loc14_;
    _loc10_ = _loc14_ ^ _loc10_;
    _loc10_ = _loc10_ ^ 8;
    _loc14_ = _loc10_ & 255;
    _loc14_ = int(_loc3_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = int(_loc10_ >>> 8);
    _loc14_ = int(_loc5_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = _loc10_ & 255;
    _loc14_ = int(_loc17_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = int(_loc10_ >>> 8);
    _loc14_ = int(_loc19_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = src ^ _loc14_;
    _loc10_ = _loc14_ ^ _loc10_;
    _loc10_ = _loc10_ ^ 10;
    _loc14_ = _loc10_ & 255;
    _loc14_ = int(_loc4_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc14_ = _loc14_ ^ _loc10_;
    _loc12_ = int(_loc14_ >>> 8);
    _loc12_ = int(_loc6_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc14_ = _loc14_ ^ _loc12_;
    _loc12_ = _loc14_ & 255;
    _loc12_ = int(tab + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc12_ = _loc12_ << 8;
    _loc14_ = _loc12_ ^ _loc14_;
    _loc12_ = int(_loc14_ >>> 8);
    _loc12_ = int(_loc9_ + _loc12_);
    _loc18_ = li8(_loc12_);
    _loc12_ = src & 255;
    _loc12_ = int(_loc13_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc12_ = _loc12_ << 8;
    src = _loc12_ ^ src;
    _loc12_ = int(src >>> 8);
    _loc12_ = int(_loc11_ + _loc12_);
    _loc12_ = li8(_loc12_);
    src = src ^ _loc12_;
    _loc12_ = src & 255;
    _loc12_ = int(_loc4_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc12_ = _loc12_ << 8;
    src = _loc12_ ^ src;
    _loc12_ = int(src >>> 8);
    _loc12_ = int(_loc6_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc12_ = _loc8_ ^ _loc12_;
    src = _loc12_ ^ src;
    _loc12_ = src ^ 11;
    src = _loc12_ ^ _loc18_;
    src = src ^ _loc14_;
    src = src ^ 14;
    _loc14_ = src & 255;
    _loc14_ = int(_loc17_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    src = _loc14_ ^ src;
    _loc14_ = int(src >>> 8);
    _loc14_ = int(_loc19_ + _loc14_);
    _loc14_ = li8(_loc14_);
    src = src ^ _loc14_;
    _loc14_ = src & 255;
    _loc14_ = int(_loc13_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    src = _loc14_ ^ src;
    _loc14_ = int(src >>> 8);
    _loc14_ = int(_loc11_ + _loc14_);
    _loc14_ = li8(_loc14_);
    src = src ^ _loc14_;
    _loc14_ = _loc8_ & 255;
    _loc14_ = int(tab + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc8_ = _loc14_ ^ _loc8_;
    _loc14_ = int(_loc8_ >>> 8);
    _loc14_ = int(_loc9_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc8_ = _loc8_ ^ _loc14_;
    _loc14_ = _loc8_ & 255;
    _loc14_ = int(_loc3_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc8_ = _loc14_ ^ _loc8_;
    _loc14_ = int(_loc8_ >>> 8);
    _loc14_ = int(_loc5_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc15_ ^ _loc14_;
    _loc8_ = _loc14_ ^ _loc8_;
    _loc14_ = _loc8_ ^ 13;
    _loc8_ = _loc12_ & 255;
    _loc8_ = int(_loc3_ + _loc8_);
    _loc8_ = li8(_loc8_);
    _loc8_ = _loc8_ << 8;
    _loc8_ = _loc8_ ^ _loc12_;
    _loc12_ = int(_loc8_ >>> 8);
    _loc12_ = int(_loc5_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc8_ = _loc8_ ^ _loc12_;
    _loc12_ = _loc8_ & 255;
    _loc12_ = int(_loc17_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc12_ = _loc12_ << 8;
    _loc8_ = _loc12_ ^ _loc8_;
    _loc12_ = int(_loc8_ >>> 8);
    _loc12_ = int(_loc19_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc12_ = _loc14_ ^ _loc12_;
    _loc8_ = _loc12_ ^ _loc8_;
    _loc8_ = _loc8_ ^ src;
    _loc8_ = _loc8_ ^ 30;
    _loc12_ = _loc8_ & 255;
    _loc12_ = int(_loc4_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc12_ = _loc12_ << 8;
    _loc8_ = _loc8_ ^ _loc12_;
    _loc12_ = int(_loc8_ >>> 8);
    _loc12_ = int(_loc6_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc8_ = _loc8_ ^ _loc12_;
    _loc12_ = _loc8_ & 255;
    _loc12_ = int(tab + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc12_ = _loc12_ << 8;
    _loc8_ = _loc8_ ^ _loc12_;
    _loc12_ = int(_loc8_ >>> 8);
    _loc12_ = int(_loc9_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc8_ = _loc8_ ^ _loc12_;
    _loc15_ = _loc15_ ^ 1;
    _loc12_ = _loc15_ & 255;
    _loc12_ = int(_loc17_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc12_ = _loc12_ << 8;
    _loc15_ = _loc12_ ^ _loc15_;
    _loc12_ = int(_loc15_ >>> 8);
    _loc12_ = int(_loc19_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc15_ = _loc15_ ^ _loc12_;
    _loc12_ = _loc15_ & 255;
    _loc12_ = int(_loc13_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc12_ = _loc12_ << 8;
    _loc15_ = _loc12_ ^ _loc15_;
    _loc12_ = int(_loc15_ >>> 8);
    _loc12_ = int(_loc11_ + _loc12_);
    _loc12_ = li8(_loc12_);
    _loc10_ = _loc10_ ^ _loc12_;
    _loc15_ = _loc10_ ^ _loc15_;
    _loc15_ = _loc15_ ^ 13;
    _loc10_ = _loc14_ & 255;
    _loc10_ = int(_loc13_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc10_ = _loc10_ << 8;
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = int(_loc10_ >>> 8);
    _loc14_ = int(_loc11_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = _loc10_ & 255;
    _loc14_ = int(_loc4_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc10_ = _loc14_ ^ _loc10_;
    _loc14_ = int(_loc10_ >>> 8);
    _loc14_ = int(_loc6_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc15_ ^ _loc14_;
    _loc10_ = _loc14_ ^ _loc10_;
    _loc10_ = _loc10_ ^ _loc8_;
    _loc10_ = _loc10_ ^ 2;
    _loc14_ = _loc10_ & 255;
    _loc14_ = int(_loc3_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = int(_loc10_ >>> 8);
    _loc14_ = int(_loc5_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = _loc10_ & 255;
    _loc14_ = int(_loc17_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = int(_loc10_ >>> 8);
    _loc14_ = int(_loc19_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc10_ ^ _loc14_;
    _loc10_ = _loc15_ & 255;
    _loc10_ = int(tab + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc10_ = _loc10_ << 8;
    _loc15_ = _loc10_ ^ _loc15_;
    _loc10_ = int(_loc15_ >>> 8);
    _loc10_ = int(_loc9_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc15_ = _loc15_ ^ _loc10_;
    _loc10_ = _loc15_ & 255;
    _loc10_ = int(_loc3_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc10_ = _loc10_ << 8;
    _loc15_ = _loc10_ ^ _loc15_;
    _loc10_ = int(_loc15_ >>> 8);
    _loc10_ = int(_loc5_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc15_ = _loc10_ ^ _loc15_;
    _loc15_ = _loc15_ ^ _loc14_;
    _loc15_ = _loc15_ ^ 19;
    _loc10_ = _loc15_ & 255;
    _loc10_ = int(_loc13_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc10_ = _loc10_ << 8;
    _loc15_ = _loc15_ ^ _loc10_;
    _loc10_ = int(_loc15_ >>> 8);
    _loc10_ = int(_loc11_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc15_ = _loc15_ ^ _loc10_;
    _loc10_ = _loc15_ & 255;
    _loc10_ = int(_loc4_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc10_ = _loc10_ << 8;
    _loc15_ = _loc15_ ^ _loc10_;
    _loc10_ = int(_loc15_ >>> 8);
    _loc10_ = int(_loc6_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc12_ = _loc15_ ^ _loc10_;
    _loc15_ = src ^ _loc12_;
    _loc15_ = _loc15_ ^ 20;
    src = _loc15_ & 255;
    src = int(tab + src);
    src = li8(src);
    src = src << 8;
    _loc15_ = _loc15_ ^ src;
    src = int(_loc15_ >>> 8);
    src = int(_loc9_ + src);
    src = li8(src);
    _loc15_ = _loc15_ ^ src;
    src = _loc15_ & 255;
    src = int(_loc3_ + src);
    src = li8(src);
    src = src << 8;
    _loc15_ = _loc15_ ^ src;
    src = int(_loc15_ >>> 8);
    src = int(_loc5_ + src);
    src = li8(src);
    _loc15_ = _loc15_ ^ src;
    src = _loc8_ ^ _loc15_;
    src = src ^ 21;
    _loc10_ = src & 255;
    _loc10_ = int(_loc17_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc10_ = _loc10_ << 8;
    src = src ^ _loc10_;
    _loc10_ = int(src >>> 8);
    _loc10_ = int(_loc19_ + _loc10_);
    _loc10_ = li8(_loc10_);
    src = src ^ _loc10_;
    _loc10_ = src & 255;
    _loc10_ = int(_loc13_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc10_ = _loc10_ << 8;
    src = src ^ _loc10_;
    _loc10_ = int(src >>> 8);
    _loc10_ = int(_loc11_ + _loc10_);
    _loc10_ = li8(_loc10_);
    _loc10_ = src ^ _loc10_;
    src = _loc14_ ^ _loc10_;
    src = src ^ 22;
    _loc8_ = src & 255;
    _loc8_ = int(_loc4_ + _loc8_);
    _loc8_ = li8(_loc8_);
    _loc8_ = _loc8_ << 8;
    src = src ^ _loc8_;
    _loc8_ = int(src >>> 8);
    _loc8_ = int(_loc6_ + _loc8_);
    _loc8_ = li8(_loc8_);
    src = src ^ _loc8_;
    _loc8_ = src & 255;
    _loc8_ = int(tab + _loc8_);
    _loc8_ = li8(_loc8_);
    _loc8_ = _loc8_ << 8;
    src = src ^ _loc8_;
    _loc8_ = int(src >>> 8);
    _loc8_ = int(_loc9_ + _loc8_);
    _loc8_ = li8(_loc8_);
    src = src ^ _loc8_;
    _loc8_ = _loc12_ ^ src;
    _loc8_ = _loc8_ ^ 23;
    _loc14_ = _loc8_ & 255;
    _loc14_ = int(_loc3_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc8_ = _loc8_ ^ _loc14_;
    _loc14_ = int(_loc8_ >>> 8);
    _loc14_ = int(_loc5_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc8_ = _loc8_ ^ _loc14_;
    _loc14_ = _loc8_ & 255;
    _loc14_ = int(_loc17_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc8_ = _loc8_ ^ _loc14_;
    _loc14_ = int(_loc8_ >>> 8);
    _loc14_ = int(_loc19_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc15_ ^ _loc14_;
    _loc8_ = _loc14_ ^ _loc8_;
    _loc8_ = _loc8_ ^ 24;
    _loc14_ = _loc8_ & 255;
    _loc14_ = int(_loc13_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc8_ = _loc8_ ^ _loc14_;
    _loc14_ = int(_loc8_ >>> 8);
    _loc14_ = int(_loc11_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc8_ = _loc8_ ^ _loc14_;
    _loc14_ = _loc8_ & 255;
    _loc14_ = int(_loc4_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc8_ = _loc8_ ^ _loc14_;
    _loc14_ = int(_loc8_ >>> 8);
    _loc14_ = int(_loc6_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc10_ ^ _loc14_;
    _loc8_ = _loc14_ ^ _loc8_;
    _loc12_ = _loc8_ ^ 26;
    _loc8_ = _loc12_ & 255;
    _loc8_ = int(_loc3_ + _loc8_);
    _loc8_ = li8(_loc8_);
    _loc8_ = _loc8_ << 8;
    _loc8_ = _loc8_ ^ _loc12_;
    _loc14_ = int(_loc8_ >>> 8);
    _loc14_ = int(_loc5_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc8_ = _loc8_ ^ _loc14_;
    _loc14_ = _loc8_ & 255;
    _loc14_ = int(_loc17_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc8_ = _loc14_ ^ _loc8_;
    _loc14_ = int(_loc8_ >>> 8);
    _loc14_ = int(_loc19_ + _loc14_);
    _loc18_ = li8(_loc14_);
    _loc14_ = _loc10_ & 255;
    _loc14_ = int(tab + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc10_ = _loc14_ ^ _loc10_;
    _loc14_ = int(_loc10_ >>> 8);
    _loc14_ = int(_loc9_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc10_ = _loc10_ ^ _loc14_;
    _loc14_ = _loc10_ & 255;
    _loc14_ = int(_loc3_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = _loc14_ << 8;
    _loc10_ = _loc14_ ^ _loc10_;
    _loc14_ = int(_loc10_ >>> 8);
    _loc14_ = int(_loc5_ + _loc14_);
    _loc14_ = li8(_loc14_);
    _loc14_ = src ^ _loc14_;
    _loc10_ = _loc14_ ^ _loc10_;
    _loc14_ = _loc10_ ^ 27;
    _loc10_ = _loc14_ ^ _loc18_;
    _loc8_ = _loc10_ ^ _loc8_;
    _loc10_ = int(_loc8_ >>> 8);
    _loc18_ = _loc15_ ^ 1;
    _loc16_ = _loc18_ & 255;
    _loc16_ = int(_loc4_ + _loc16_);
    _loc16_ = li8(_loc16_);
    _loc16_ = _loc16_ << 8;
    _loc18_ = _loc16_ ^ _loc18_;
    _loc16_ = int(_loc18_ >>> 8);
    _loc16_ = int(_loc6_ + _loc16_);
    _loc16_ = li8(_loc16_);
    _loc18_ = _loc18_ ^ _loc16_;
    _loc16_ = _loc18_ & 255;
    _loc16_ = int(tab + _loc16_);
    _loc16_ = li8(_loc16_);
    _loc16_ = _loc16_ << 8;
    _loc18_ = _loc16_ ^ _loc18_;
    _loc16_ = int(_loc18_ >>> 8);
    _loc16_ = int(_loc9_ + _loc16_);
    _loc16_ = li8(_loc16_);
    _loc12_ = _loc12_ ^ _loc16_;
    _loc12_ = _loc12_ ^ _loc18_;
    _loc12_ = _loc12_ ^ 29;
    _loc18_ = _loc12_ & 255;
    _loc18_ = int(_loc17_ + _loc18_);
    _loc18_ = li8(_loc18_);
    _loc18_ = _loc18_ << 8;
    _loc18_ = _loc18_ ^ _loc12_;
    _loc16_ = int(_loc18_ >>> 8);
    _loc16_ = int(_loc19_ + _loc16_);
    _loc16_ = li8(_loc16_);
    _loc18_ = _loc18_ ^ _loc16_;
    _loc16_ = _loc18_ & 255;
    _loc16_ = int(_loc13_ + _loc16_);
    _loc16_ = li8(_loc16_);
    _loc16_ = _loc16_ << 8;
    _loc18_ = _loc16_ ^ _loc18_;
    _loc16_ = int(_loc18_ >>> 8);
    _loc21_ = int(_loc11_ + _loc16_);
    _loc21_ = li8(_loc21_);
    _loc20_ = src & 255;
    _loc17_ = int(_loc17_ + _loc20_);
    _loc17_ = li8(_loc17_);
    _loc17_ = _loc17_ << 8;
    _loc17_ = _loc17_ ^ src;
    src = int(_loc17_ >>> 8);
    _loc19_ = int(_loc19_ + src);
    _loc19_ = li8(_loc19_);
    _loc17_ = _loc17_ ^ _loc19_;
    _loc19_ = _loc17_ & 255;
    _loc19_ = int(_loc13_ + _loc19_);
    _loc19_ = li8(_loc19_);
    _loc19_ = _loc19_ << 8;
    _loc17_ = _loc19_ ^ _loc17_;
    _loc19_ = int(_loc17_ >>> 8);
    _loc19_ = int(_loc11_ + _loc19_);
    _loc19_ = li8(_loc19_);
    _loc19_ = _loc15_ ^ _loc19_;
    _loc17_ = _loc19_ ^ _loc17_;
    _loc17_ = _loc17_ ^ 29;
    _loc19_ = _loc17_ & 255;
    tab = int(tab + _loc19_);
    tab = li8(tab);
    tab = tab << 8;
    tab = tab ^ _loc17_;
    _loc19_ = int(tab >>> 8);
    _loc9_ = int(_loc9_ + _loc19_);
    _loc9_ = li8(_loc9_);
    _loc9_ = tab ^ _loc9_;
    tab = _loc9_ & 255;
    _loc3_ = int(_loc3_ + tab);
    _loc3_ = li8(_loc3_);
    _loc3_ = _loc3_ << 8;
    _loc3_ = _loc3_ ^ _loc9_;
    _loc9_ = int(_loc3_ >>> 8);
    _loc5_ = int(_loc5_ + _loc9_);
    _loc5_ = li8(_loc5_);
    _loc9_ = _loc14_ & 255;
    _loc9_ = int(_loc13_ + _loc9_);
    _loc9_ = li8(_loc9_);
    _loc9_ = _loc9_ << 8;
    _loc9_ = _loc9_ ^ _loc14_;
    tab = int(_loc9_ >>> 8);
    tab = int(_loc11_ + tab);
    tab = li8(tab);
    _loc9_ = _loc9_ ^ tab;
    tab = _loc9_ & 255;
    tab = int(_loc4_ + tab);
    tab = li8(tab);
    tab = tab << 8;
    _loc9_ = tab ^ _loc9_;
    tab = int(_loc9_ >>> 8);
    tab = int(_loc6_ + tab);
    _loc11_ = li8(tab);
    tab = dest;
    si8(_loc10_,tab);
    _loc13_ = _loc8_ ^ 30;
    si8(_loc13_,tab + 1);
    si8(_loc16_,tab + 2);
    _loc13_ = _loc18_ ^ _loc21_;
    si8(_loc13_,tab + 3);
    _loc5_ = _loc12_ ^ _loc5_;
    _loc5_ = _loc5_ ^ _loc3_;
    _loc3_ = int(_loc5_ >>> 8);
    si8(_loc3_,tab + 4);
    _loc5_ = _loc5_ ^ 32;
    si8(_loc5_,tab + 5);
    _loc5_ = _loc17_ ^ _loc11_;
    _loc5_ = _loc5_ ^ _loc9_;
    _loc3_ = int(_loc5_ >>> 8);
    si8(_loc3_,tab + 6);
    _loc5_ = _loc5_ ^ 31;
    si8(_loc5_,tab + 7);
}
