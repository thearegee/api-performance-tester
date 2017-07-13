async function fetchData(url) {
  try {
    performance.mark('fetch-request-start');
    const response = await fetch(url);
    performance.mark('fetch-request-end');
    performance.measure(
      'fetch-request-audit',
      'fetch-request-start',
      'fetch-request-end'
    );
    const timings = performance.getEntriesByName('fetch-request-audit')[0]
      .duration;
    const responseSize = response.headers.get('Content-Length') / 1024;
    return {
      data: response,
      timings: timings.toFixed(0),
      // this is broken need a add headers to api to fix
      responseSize: responseSize.toFixed(0)
    };
  } catch (error) {
    console.log(error);
  }
}

function getDataWithXHR(url, callback) {
  var request = new XMLHttpRequest();
  request.onload = response => {
    performance.mark('xhr-request-end');

    performance.measure(
      'xhr-request-audit',
      'xhr-request-start',
      'xhr-request-end'
    );

    const timings = performance.getEntriesByName('xhr-request-audit')[0]
      .duration;
    const responseSize = request.getResponseHeader('Content-Length') / 1024;

    callback({
      data: response.target.response,
      timings: timings.toFixed(0),
      // this is broken need a add headers to api to fix
      responseSize: responseSize.toFixed(0)
    });
  };

  performance.mark('xhr-request-start');
  request.open('GET', url, true);
  request.send();
}

async function parseJson(response) {
  performance.mark('parse-start');
  const json = await response.json();
  performance.mark('parse-end');
  performance.measure('parse-audit', 'parse-start', 'parse-end');
  const timings = performance.getEntriesByName('parse-audit')[0].duration;
  return timings.toFixed(0);
}

function parseStringToJSON(data) {
  performance.mark('parse-string-start');
  const json = JSON.parse(data);
  performance.mark('parse-string-end');
  performance.measure(
    'parse-string-audit',
    'parse-string-start',
    'parse-string-end'
  );
  const timings = performance.getEntriesByName('parse-string-audit')[0]
    .duration;
  return timings.toFixed(0);
}

async function performanceTestApiWithFetch(path) {
  const request = await fetchData(path);
  const parse = await parseJson(request.data);
  const performanceMetrics = formatPerformanceMetrics(
    'Fetch',
    request,
    parse,
    path
  );
  console.log(performanceMetrics);
  return JSON.stringify(performanceMetrics);
}

function performanceTestApiWithXHR(path) {
  return new Promise((resolve, reject) => {
    const timings = getDataWithXHR(path, response => {
      const parse = parseStringToJSON(response.data);
      const performanceMetrics = formatPerformanceMetrics(
        'XHR',
        response,
        parse,
        path
      );
      console.log(performanceMetrics);
      resolve(JSON.stringify(performanceMetrics));
    });
  });
}

function formatPerformanceMetrics(name, request, parse, path) {
  return {
    name: name,
    request: {
      raw: request.timings,
      message: `${request.timings}ms`
    },
    parse: {
      raw: parse,
      message: `${parse}ms`
    },
    responseSize: {
      raw: request.responseSize,
      message: `${request.responseSize}kb`
    },
    path: path
  };
}

// A performance demo you can call if you want to test just in the browser
// Example using the NET-A-PORTER product api
function performanceDemo() {
  performanceTestApiWithXHR(
    'https://api.net-a-porter.com/NAP/GB/en/50/0/summaries/expand?customListUrlKeys=whats-new-this-month'
  );

  performanceTestApiWithFetch(
    'https://api.net-a-porter.com/NAP/GB/en/50/0/summaries/expand?customListUrlKeys=whats-new-this-month'
  );
}
