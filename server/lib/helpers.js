/*
 * Copyright 2016, Lorenzo Mangani (lorenzo.mangani@gmail.com)
 * Copyright 2015, Rao Chenlin (rao.chenlin@gmail.com)
 *
 * This file is part of Sentinl (http://github.com/sirensolutions/sentinl)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import getElasticsearchClient from './get_elasticsearch_client';

var dynamicTemplates = [ {
  string_fields : {
    mapping : {
      type : 'string',
      index : 'not_analyzed',
      doc_values: true,
      fields : {
        search : {
          index : 'analyzed',
          omit_norms : true,
          type : 'string',
        }
      }
    },
    match_mapping_type : 'string',
    match : '*'
  }
}];


function createSentinlIndex(server, config) {
  server.log(['status', 'info', 'Sentinl'], 'Core Index check...');
  if (!server.plugins.elasticsearch) {
    server.log(['status', 'error', 'Sentinl'], 'Elasticsearch client not available, retrying in 5s');
    tryCreate(server);
    return;
  }

  var client = getElasticsearchClient(server);
  client.indices.exists({
    index: config.es.default_index
  }, function (error, exists) {
    if (exists === true) {
      server.log(['status', 'debug', 'Sentinl'], 'Core Index exists!');
      return;
    }
    server.log(['status', 'debug', 'Sentinl'], 'Creating Sentinl core Index...');
    client.indices.create({
      index: config.es.default_index,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1
        },
        mappings: {
          watch: {
            properties: {
              input: {
                type: 'object',
                enabled: false
              },
              transform: {
                type: 'object',
                enabled: false
              },
              condition: {
                type: 'object',
                enabled: false
              }
            }
          }
        }
      }
    })
    .then(function (resp) {
      server.log(['status', 'info', 'Sentinl'], 'Core Index response', resp);
    }, function (err) {
      server.log(['status', 'warning', 'Sentinl'], err.message);
    });
  });
}

var tryCount = 0;
function tryCreate(server) {
  if (tryCount > 5) {
    server.log(['status', 'warning', 'Sentinl'], 'Failed creating Indices mapping!');
    return;
  }
  setTimeout(createSentinlIndex, 5000);
  tryCount++;
}


function createSentinlAlarmIndex(server,config) {
  server.log(['status', 'info', 'Sentinl'], 'Alarm Index check...');
  if (!server.plugins.elasticsearch) {
    server.log(['status', 'error', 'Sentinl'], 'Elasticsearch client not available, retrying in 5s');
    tryAlarmCreate(server);
    return;
  }

  var client = getElasticsearchClient(server);
  client.indices.exists({
    index: config.es.alarm_index
  }, function (error, exists) {
    if (exists === true) {
      server.log(['status', 'debug', 'Sentinl'], 'Alarms Index exists!');
      return;
    }
    server.log(['status', 'debug', 'Sentinl'], 'Creating Sentinl Alarms Index...');
    client.indices.create({
      index: config.es.alarm_index,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1
        },
        mappings: {
          _default_: {
            properties: {
              payload: {
                type: 'object',
                enabled:  false
              },
              attachment : {
                type : 'binary'
              }
            }
          }
        }
      }
    })
    .then(function (resp) {
      server.log(['status', 'info', 'Sentinl'], 'Alarm Index response', resp);
    }, function (err) {
      server.log(['error', 'warning', 'Sentinl'], err.message);
    });
  });
}

var tryAlarmCount = 0;
function tryAlarmCreate(server) {
  if (tryCount > 5) {
    server.log(['error', 'warning', 'Sentinl'], 'Failed creating Alarm Indices mapping!');
    return;
  }
  setTimeout(createSentinlAlarmIndex, 5000);
  tryAlarmCount++;
}


module.exports = {
  createSentinlAlarmIndex: createSentinlAlarmIndex,
  createSentinlIndex: createSentinlIndex,
  tryCreate: tryCreate,
  tryAlarmCreate: tryAlarmCreate
};
