// From Omnitone.Polyfill
// https://github.com/GoogleChrome/omnitone/blob/master/src/polyfill.js

function getBrowserInfo () {
  var ua = navigator.userAgent;
  var M = ua.match(
      /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) ||
      [];
  var tem;

  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return {name: 'IE', version: (tem[1] || '')};
  }

  if (M[1] === 'Chrome') {
    tem = ua.match(/\bOPR|Edge\/(\d+)/);
    if (tem != null) {
      return {name: 'Opera', version: tem[1]};
    }
  }

  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  if ((tem = ua.match(/version\/([\d.]+)/i)) != null) {
    M.splice(1, 1, tem[1]);
  }

  var platform = ua.match(/android|ipad|iphone/i);
  if (!platform) {
    platform = ua.match(/cros|linux|mac os x|windows/i);
  }

  return {
    name: M[0],
    version: M[1],
    platform: platform ? platform[0] : 'unknown',
  };
};