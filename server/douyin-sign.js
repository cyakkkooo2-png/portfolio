/*
 * Douyin Web a_bogus signer.
 * Adapted from jiuhunwl/short_videos (MIT License, Copyright 2025 jiuhunwl).
 * https://github.com/jiuhunwl/short_videos
 */
const crypto = require('crypto');

const ALPHABET = 'Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe';

function rc4(value, keyBytes) {
  const key = Buffer.from(keyBytes);
  const state = Array.from({ length: 256 }, (_, index) => index);
  let j = 0;
  for (let i = 0; i < 256; i += 1) {
    j = (j + state[i] + key[i % key.length]) % 256;
    [state[i], state[j]] = [state[j], state[i]];
  }
  let i = 0;
  j = 0;
  const input = Buffer.isBuffer(value) ? value : Buffer.from(value, 'latin1');
  const output = Buffer.alloc(input.length);
  for (let index = 0; index < input.length; index += 1) {
    i = (i + 1) % 256;
    j = (j + state[i]) % 256;
    [state[i], state[j]] = [state[j], state[i]];
    output[index] = state[(state[i] + state[j]) % 256] ^ input[index];
  }
  return output;
}

function sm3(value) {
  return crypto.createHash('sm3').update(value).digest();
}

function doubleSm3(value) {
  return sm3(sm3(value));
}

function encodeCustom(value, alphabet = ALPHABET) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(value, 'latin1');
  let output = '';
  for (let offset = 0; offset < input.length; offset += 3) {
    const long = ((input[offset] || 0) << 16)
      | ((input[offset + 1] || 0) << 8)
      | (input[offset + 2] || 0);
    output += alphabet[(long & 0xfc0000) >> 18];
    output += alphabet[(long & 0x03f000) >> 12];
    output += alphabet[(long & 0x000fc0) >> 6];
    output += alphabet[long & 0x00003f];
  }
  return output;
}

function mixedRandom(random, option) {
  return [
    ((random & 0xff & 0xaa) | (option[0] & 0x55)) >>> 0,
    ((random & 0xff & 0x55) | (option[0] & 0xaa)) >>> 0,
    ((((random >> 8) & 0xff) & 0xaa) | (option[1] & 0x55)) >>> 0,
    ((((random >> 8) & 0xff) & 0x55) | (option[1] & 0xaa)) >>> 0,
  ];
}

function randomPrefix() {
  return Buffer.from([
    ...mixedRandom(Math.floor(Math.random() * 10000), [3, 45]),
    ...mixedRandom(Math.floor(Math.random() * 10000), [1, 0]),
    ...mixedRandom(Math.floor(Math.random() * 10000), [1, 5]),
  ]);
}

function payload(query, userAgent) {
  const start = Date.now();
  const queryHash = doubleSm3(Buffer.from(`${query}cus`));
  const suffixHash = doubleSm3(Buffer.from('cus'));
  const encodedUa = encodeCustom(rc4(Buffer.from(userAgent), [0, 1, 14]), 'ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe');
  const uaHash = sm3(Buffer.from(encodedUa));
  const end = Date.now();
  const b = {};
  b[8] = 3;
  b[10] = end;
  b[16] = start;
  b[18] = 44;
  b[20] = (start >> 24) & 255;
  b[21] = (start >> 16) & 255;
  b[22] = (start >> 8) & 255;
  b[23] = start & 255;
  b[24] = Math.floor(start / (256 ** 4));
  b[25] = Math.floor(start / (256 ** 5));
  b[26] = 0; b[27] = 0; b[28] = 0; b[29] = 0;
  b[30] = 0; b[31] = 1; b[32] = 0; b[33] = 0;
  b[34] = 0; b[35] = 0; b[36] = 0; b[37] = 14;
  b[38] = queryHash[21]; b[39] = queryHash[22];
  b[40] = suffixHash[21]; b[41] = suffixHash[22];
  b[42] = uaHash[23]; b[43] = uaHash[24];
  b[44] = (end >> 24) & 255;
  b[45] = (end >> 16) & 255;
  b[46] = (end >> 8) & 255;
  b[47] = end & 255;
  b[48] = b[8];
  b[49] = Math.floor(end / (256 ** 4));
  b[50] = Math.floor(end / (256 ** 5));
  b[52] = (6241 >> 24) & 255;
  b[53] = (6241 >> 16) & 255;
  b[54] = (6241 >> 8) & 255;
  b[55] = 6241 & 255;
  b[57] = 6383 & 255;
  b[58] = (6383 >> 8) & 255;
  b[59] = (6383 >> 16) & 255;
  b[60] = (6383 >> 24) & 255;
  const environment = Buffer.from('1536|747|1536|834|0|30|0|0|1536|834|1536|864|1525|747|24|24|Win32');
  b[65] = environment.length & 255;
  b[66] = (environment.length >> 8) & 255;
  b[70] = 0; b[71] = 0;
  const checksumKeys = [18, 20, 26, 30, 38, 40, 42, 21, 27, 31, 35, 39, 41, 43, 22, 28, 32, 36, 23, 29, 33, 37, 44, 45, 46, 47, 48, 49, 50, 24, 25, 52, 53, 54, 55, 57, 58, 59, 60, 65, 66, 70, 71];
  const checksum = checksumKeys.reduce((result, key) => result ^ b[key], 0);
  const order = [18, 20, 52, 26, 30, 34, 58, 38, 40, 53, 42, 21, 27, 54, 55, 31, 35, 57, 39, 41, 43, 22, 28, 32, 60, 36, 23, 29, 33, 37, 44, 45, 59, 46, 47, 48, 49, 50, 24, 25, 65, 66, 70, 71];
  return rc4(Buffer.concat([Buffer.from(order.map((key) => b[key])), environment, Buffer.from([checksum])]), [121]);
}

function generateABogus(query, userAgent) {
  return `${encodeCustom(Buffer.concat([randomPrefix(), payload(query, userAgent)]))}=`;
}

module.exports = { generateABogus };
