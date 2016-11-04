function utf8ToUtf16(utf8_bytes) {
  var unicode_codes = [];
  var unicode_code = 0;
  var num_followed = 0;
  for (var i = 0; i < utf8_bytes.length; ++i) {
    var utf8_byte = utf8_bytes[i];
    if (utf8_byte >= 0x100) {
      // Malformed utf8 byte ignored.
    } else if ((utf8_byte & 0xC0) == 0x80) {
      if (num_followed > 0) {
        unicode_code = (unicode_code << 6) | (utf8_byte & 0x3f);
        num_followed -= 1;
      } else {
        // Malformed UTF-8 sequence ignored.
      }
    } else {
      if (num_followed == 0) {
        unicode_codes.push(unicode_code);
      } else {
        // Malformed UTF-8 sequence ignored.
      }
      if (utf8_byte < 0x80){  // 1-byte
        unicode_code = utf8_byte;
        num_followed = 0;
      } else if ((utf8_byte & 0xE0) == 0xC0) {  // 2-byte
        unicode_code = utf8_byte & 0x1f;
        num_followed = 1;
      } else if ((utf8_byte & 0xF0) == 0xE0) {  // 3-byte
        unicode_code = utf8_byte & 0x0f;
        num_followed = 2;
      } else if ((utf8_byte & 0xF8) == 0xF0) {  // 4-byte
        unicode_code = utf8_byte & 0x07;
        num_followed = 3;
      } else {
        // Malformed UTF-8 sequence ignored.
      }
    }
  }
  if (num_followed == 0) {
    unicode_codes.push(unicode_code);
  } else {
    // Malformed UTF-8 sequence ignored.
  }
  unicode_codes.shift();  // Trim the first element.

  var utf16_codes = [];
  for (var i = 0; i < unicode_codes.length; ++i) {
    var unicode_code = unicode_codes[i];
    if (unicode_code < (1 << 16)) {
      utf16_codes.push(unicode_code);
    } else {
      var first = ((unicode_code - (1 << 16)) / (1 << 10)) + 0xD800;
      var second = (unicode_code % (1 << 10)) + 0xDC00;
      utf16_codes.push(first)
      utf16_codes.push(second)
    }
  }
  return utf16_codes;
}  
function utf8ToUtf16(utf8_bytes) {
  var unicode_codes = [];
  var unicode_code = 0;
  var num_followed = 0;
  for (var i = 0; i < utf8_bytes.length; ++i) {
    var utf8_byte = utf8_bytes[i];
    if (utf8_byte >= 0x100) {
      // Malformed utf8 byte ignored.
    } else if ((utf8_byte & 0xC0) == 0x80) {
      if (num_followed > 0) {
        unicode_code = (unicode_code << 6) | (utf8_byte & 0x3f);
        num_followed -= 1;
      } else {
        // Malformed UTF-8 sequence ignored.
      }
    } else {
      if (num_followed == 0) {
        unicode_codes.push(unicode_code);
      } else {
        // Malformed UTF-8 sequence ignored.
      }
      if (utf8_byte < 0x80){  // 1-byte
        unicode_code = utf8_byte;
        num_followed = 0;
      } else if ((utf8_byte & 0xE0) == 0xC0) {  // 2-byte
        unicode_code = utf8_byte & 0x1f;
        num_followed = 1;
      } else if ((utf8_byte & 0xF0) == 0xE0) {  // 3-byte
        unicode_code = utf8_byte & 0x0f;
        num_followed = 2;
      } else if ((utf8_byte & 0xF8) == 0xF0) {  // 4-byte
        unicode_code = utf8_byte & 0x07;
        num_followed = 3;
      } else {
        // Malformed UTF-8 sequence ignored.
      }
    }
  }
  if (num_followed == 0) {
    unicode_codes.push(unicode_code);
  } else {
    // Malformed UTF-8 sequence ignored.
  }
  unicode_codes.shift();  // Trim the first element.

  var utf16_codes = [];
  for (var i = 0; i < unicode_codes.length; ++i) {
    var unicode_code = unicode_codes[i];
    if (unicode_code < (1 << 16)) {
      utf16_codes.push(unicode_code);
    } else {
      var first = ((unicode_code - (1 << 16)) / (1 << 10)) + 0xD800;
      var second = (unicode_code % (1 << 10)) + 0xDC00;
      utf16_codes.push(first)
      utf16_codes.push(second)
    }
  }
  return utf16_codes;
}

export function utf8_to_ascii( str ) {
  // return unescape(encodeURIComponent(str))
  const char2bytes = unicode_code => {
    var utf8_bytes = [];
    if (unicode_code < 0x80) {  // 1-byte
      utf8_bytes.push(unicode_code);
    } else if (unicode_code < (1 << 11)) {  // 2-byte
      utf8_bytes.push((unicode_code >>> 6) | 0xC0);
      utf8_bytes.push((unicode_code & 0x3F) | 0x80);
    } else if (unicode_code < (1 << 16)) {  // 3-byte
      utf8_bytes.push((unicode_code >>> 12) | 0xE0);
      utf8_bytes.push(((unicode_code >> 6) & 0x3f) | 0x80);
      utf8_bytes.push((unicode_code & 0x3F) | 0x80);
    } else if (unicode_code < (1 << 21)) {  // 4-byte
      utf8_bytes.push((unicode_code >>> 18) | 0xF0);
      utf8_bytes.push(((unicode_code >> 12) & 0x3F) | 0x80);
      utf8_bytes.push(((unicode_code >> 6) & 0x3F) | 0x80);
      utf8_bytes.push((unicode_code & 0x3F) | 0x80);
    }
    return utf8_bytes;
  }
  let o = []
  for (let i = 0; i < str.length; i++) {
    o = o.concat(char2bytes(str.charCodeAt(i)))
  }
  return o.map(i => String.fromCharCode(i)).join('')
}
export function ascii_to_utf8( str ) {
  // return decodeURIComponent(escape(str))
  let bytes = str.split('').map(i => i.charCodeAt(0))
  return utf8ToUtf16(bytes).map(i => String.fromCharCode(i)).join('')
}