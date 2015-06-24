/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vector2 = require('vector2');

var main = new UI.Card({
  title: 'Pebble.js',
  icon: 'images/menu_icon.png',
  subtitle: 'Hello World!',
  body: 'Press any button.'
});

main.show();

main.on('click', 'up', function(e) {
  var menu = new UI.Menu({
    sections: [{
      items: [{
        title: 'Pebble.js',
        icon: 'images/menu_icon.png',
        subtitle: 'Can do Menus'
      }, {
        title: 'Second Item',
        subtitle: 'Subtitle Text'
      }]
    }]
  });
  menu.on('select', function(e) {
    console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
    console.log('The item is titled "' + e.item.title + '"');
  });
  menu.show();
});

main.on('click', 'select', function(e) {
  var wind = new UI.Window({
    fullscreen: true,
  });
  var textfield = new UI.Text({
    position: new Vector2(0, 65),
    size: new Vector2(144, 30),
    font: 'gothic-24-bold',
    text: 'Text Anywhere!',
    textAlign: 'center'
  });
  wind.add(textfield);
  wind.show();
});

main.on('click', 'down', function(e) {
  
  console.log('PebbleKit JS ready!');

  // Get token
  Pebble.getTimelineToken(
  function (token) {
    doany_auth(token);
    console.log('My timeline token is ' + token);
  },
  function (error) { 
    console.log('Error getting timeline token: ' + error);
  }
  );
  
  // get all tasks
  
  
  var card = new UI.Card();
  card.title('A Card');
  card.subtitle('Is a Window');
  card.body('The simplest window type in Pebble.js.');
  card.show();
});

/******************************* timeline lib *********************************/

// The timeline public URL root
var API_URL_ROOT = 'https://timeline-api.getpebble.com/';

/**
 * Send a request to the Pebble public web timeline API.
 * @param pin The JSON pin to insert. Must contain 'id' field.
 * @param type The type of request, either PUT or DELETE.
 * @param callback The callback to receive the responseText after the request has completed.
 */
function timelineRequest(token, pin, type, callback) {
  // User or shared?
  var url = API_URL_ROOT + 'v1/user/pins/' + pin.id;

  console.log('create something');
  
  // Create XHR
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    console.log('timeline: response received: ' + this.responseText);
    callback(this.responseText);
  };
  xhr.onreadystatechange = function (event) {  
    if (xhr.readyState === 4) {  
        if (xhr.status === 200) {  
          console.log(xhr.responseText);
        } else {  
           console.log("Error", xhr.statusText);  
        }  
    }  
}; 
  xhr.open(type, url);

  console.log('getting timeline token');
  
//   Pebble.getTimelineToken(function(token) {
//     console.log('this is token ' + token);
    // Add headers
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-User-Token', '' + token);

    // Send
    xhr.send(JSON.stringify(pin));
    console.log('timeline: request sent.');
//   }, function(error) { console.log('timeline: error getting timeline token: ' + error); });
}

/**
 * Insert a pin into the timeline for this user.
 * @param pin The JSON pin to insert.
 * @param callback The callback to receive the responseText after the request has completed.
 */
function insertUserPin(token, pin, callback) {
  console.log('put something');
  timelineRequest(token, pin, 'PUT', callback);
}

/**
 * Delete a pin from the timeline for this user.
 * @param pin The JSON pin to delete.
 * @param callback The callback to receive the responseText after the request has completed.
 */
function deleteUserPin(pin, callback) {
  timelineRequest(pin, 'DELETE', callback);
}

/***************************** end timeline lib *******************************/

/******************************* anydoapp lib *********************************/

function doany_auth(token) {
  var base_url = "https://sm-prod2.any.do/";
  var xhr = new XMLHttpRequest();
  xhr.open('POST', base_url + 'j_spring_security_check');
  console.log('posting to ' + base_url + 'j_spring_security_check');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send('j_username=<enter-urlencoded-username>&j_password=<enter-urlencoded-password>&_spring_security_remember_me=on');
  xhr.onload = function () {
    var auth = this.getResponseHeader('X-Anydo-Auth');
    doany_tasks(token, auth);
  };
}

function doany_tasks(token, auth) {
  var base_url = "https://sm-prod2.any.do/";
    var xhr2 = new XMLHttpRequest();
    xhr2.onload = function () {
      doany_tasks_timeline(token, this.responseText);
    };
    console.log('auth is ' + auth);
    xhr2.open('GET', base_url + 'me/tasks?includeDeleted=false');
    xhr2.setRequestHeader('X-Anydo-Auth', auth);
    xhr2.send();
}

function doany_tasks_timeline(token, tasks_json) {
  var tasks = JSON.parse(tasks_json);
  for (var i in tasks) {
    if (tasks[i].dueDate) {
      
        // An hour ahead
        var date = new Date(tasks[i].dueDate);
        
        var titleStatus = "[ ] ";
        var icon = "system://images/TIMELINE_CALENDAR";
        if (tasks[i].status == "DONE" || tasks[i].status == "CHECKED") {
          titleStatus = "[x] ";
          icon = "system://images/GENERIC_CONFIRMATION";
        }
        
        // Create the pin
        var pin = {
          "id": "pindoany" + btoa(tasks[i].id),
          "time": date.toISOString(),
          "layout": {
            "type": "calendarPin",
            "title": titleStatus + tasks[i].title,
            "tinyIcon": icon
          }
        };
    
        console.log('Inserting pin in the future: ' + JSON.stringify(pin));
      
        insertUserPin(token, pin, function(responseText) { 
          console.log('Result: ' + responseText);
        });
    }
  }
}
