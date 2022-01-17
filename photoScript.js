
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }, function(error) {
        appendPre(JSON.stringify(error, null, 2));
    });
}


function getGPXForLogs(file_id, date, plot) {
    return new Promise((resolve ,reject)=> {

        (function () {
            gapi.client.drive.files.get({
                'fileId': file_id,
                'alt': 'media',
            }).then(function (response) {
                var gpx = response.body;

                var trk = gpx.substring(
                    gpx.indexOf("<trkseg>") + 8,
                    gpx.lastIndexOf("</trkseg>")
                );

                trk = trk.replaceAll("<trkseg>", '');
                trk = trk.replaceAll("</trkseg>", '');

                var arrayOfLines = trk.match(/[^\r\n]+/g);

                var points = [];
                var accuracies = [];
                var lastPoint;

                for (var w = 0; w < arrayOfLines.length; w++) {
                    var line = arrayOfLines[w];
                    var lat = line.substring(
                        line.lastIndexOf('<trkpt lat="') + 12,
                        line.lastIndexOf('" lon="')
                    );
                    var ln = line.substring(
                        line.lastIndexOf('lon="') + 5,
                        line.lastIndexOf('"><time>')
                    );
                    var timestamp = line.substring(
                        line.lastIndexOf('<time>') + 6,
                        line.lastIndexOf('</time>')
                    );

                    var accuracy = line.substring(
                        line.lastIndexOf('<accuracy>') + 10,
                        line.lastIndexOf('</accuracy>')
                    );


                    let timestampLong = getMilliseconds(timestamp);

                    const dateObject = new Date(timestampLong);

                    var point = {
                        lat:parseFloat(lat),
                        ln:parseFloat(ln),
                        timestamp: timestampLong,
                        accuracy: accuracy,
                        valid: true
                    };
                    accuracies.push(accuracy);

                    let deltaD = 0;
                    let deltaT = 0;
                    if(!isUndefined(lastPoint)){
                        deltaD = calcCrow(point,lastPoint);
                        deltaT =  point.timestamp - lastPoint.timestamp;
                    }


                    let geometry = geometryByPlot[acrnByPlot[plot]];
                    let insidePlot = inside(point,geometry[0]);
                    // let validSpeed = deltaT === 0 || (deltaD/(deltaT*1000))<= 3;
                    // let validAccuracy = true;
                    //
                    // let valid = insidePlot && validSpeed && validAccuracy;

                    lastPoint = point;

                    //points.push(date+";"+ plot + ";" + parseFloat(lat) +";" +parseFloat(ln) +";" + dateObject.toLocaleString() +";" + deltaD + ";" + deltaT+ ";"+accuracy+";" + insidePlot);

                    points.push({
                        date:date,
                        plot:plot,
                        lat: parseFloat(lat),
                        ln: parseFloat(ln),
                        timestamp: getStringFormatedDate(dateObject),
                        deltaD: deltaD,
                        deltaT: deltaT,
                        accuracy: parseFloat(accuracy),
                        insidePlot: insidePlot,
                        valid: true
                    });
                }

                accuracies.sort();

                let index = Math.floor(0.95*accuracies.length);

                for(let w = 0; w < points.length; w++){
                    let validAccuracy = points[w].accuracy <= 5 || accuracies[index] >= points[w].accuracy;
                    let validSpeed = points[w].deltaT === 0 || (points[w].deltaD/(points[w].deltaT*1000))<= 3;
                    points[w].valid = points[w].insidePlot && validSpeed && validAccuracy
                }

                resolve(points);

            });
        }());
    });
}
function getGPXForStayPoint(file_id, date, plot) {
    return new Promise((resolve ,reject)=> {

        (function () {
            gapi.client.drive.files.get({
                'fileId': file_id,
                'alt': 'media',
            }).then(function (response) {
                var gpx = response.body;

                var trk = gpx.substring(
                    gpx.indexOf("<trkseg>") + 8,
                    gpx.lastIndexOf("</trkseg>")
                );

                trk = trk.replaceAll("<trkseg>", '');
                trk = trk.replaceAll("</trkseg>", '');

                var arrayOfLines = trk.match(/[^\r\n]+/g);

                var points = [];
                var accuracies = [];
                var lastPoint;

                for (var w = 0; w < arrayOfLines.length; w++) {
                    var line = arrayOfLines[w];
                    var lat = line.substring(
                        line.lastIndexOf('<trkpt lat="') + 12,
                        line.lastIndexOf('" lon="')
                    );
                    var ln = line.substring(
                        line.lastIndexOf('lon="') + 5,
                        line.lastIndexOf('"><time>')
                    );
                    var timestamp = line.substring(
                        line.lastIndexOf('<time>') + 6,
                        line.lastIndexOf('</time>')
                    );

                    var accuracy = line.substring(
                        line.lastIndexOf('<accuracy>') + 10,
                        line.lastIndexOf('</accuracy>')
                    );


                    // var valid = line.substring(
                    //     line.lastIndexOf('<valid>') + 7,
                    //     line.lastIndexOf('</valid>')
                    // );

                    let timestampLong = getMilliseconds(timestamp);

                    const dateObject = new Date(timestampLong);

                    var point = {
                        lat:parseFloat(lat),
                        ln:parseFloat(ln),
                        timestamp: timestampLong,
                        accuracy: accuracy,
                        valid: true
                    };
                    accuracies.push(accuracy);

                    let deltaD = 0;
                    let deltaT = 0;
                    if(!isUndefined(lastPoint)){
                        deltaD = calcCrow(point,lastPoint);
                        deltaT =  point.timestamp - lastPoint.timestamp;
                    }


                    let geometry = geometryByPlot[acrnByPlot[plot]];
                    let insidePlot = inside(point,geometry[0]);
                    // let validSpeed = deltaT === 0 || (deltaD/(deltaT*1000))<= 3;
                    // let validAccuracy = true;
                    //
                    // let valid = insidePlot && validSpeed && validAccuracy;

                    lastPoint = point;

                    //points.push(date+";"+ plot + ";" + parseFloat(lat) +";" +parseFloat(ln) +";" + dateObject.toLocaleString() +";" + deltaD + ";" + deltaT+ ";"+accuracy+";" + insidePlot);

                    points.push({
                        date:date,
                        plot:plot,
                        lat: parseFloat(lat),
                        ln: parseFloat(ln),
                        timestamp: timestampLong,
                        deltaD: deltaD,
                        deltaT: deltaT,
                        accuracy: parseFloat(accuracy),
                        insidePlot: insidePlot,
                        valid: true
                    });
                }

                accuracies.sort();

                let validPoints = [];
                let index = Math.floor(0.95*accuracies.length);

                for(let w = 0; w < points.length; w++){
                    let validAccuracy = points[w].accuracy <= 5 || accuracies[index] >= points[w].accuracy;
                    let validSpeed = points[w].deltaT === 0 || (points[w].deltaD/(points[w].deltaT*1000))<= 3;
                    if(points[w].insidePlot && validSpeed && validAccuracy)
                        validPoints.push(points[w]);
                }


                resolve(detectStayPoints(validPoints));
            });
        }());
    });
}
function getGPX2(file_id, date, plot) {
    return new Promise((resolve ,reject)=> {

        (function () {
            gapi.client.drive.files.get({
                'fileId': file_id,
                'alt': 'media',
            }).then(function (response) {
                var gpx = response.body;

                var trk = gpx.substring(
                    gpx.indexOf("<trkseg>") + 8,
                    gpx.lastIndexOf("</trkseg>")
                );

                trk = trk.replaceAll("<trkseg>", '');
                trk = trk.replaceAll("</trkseg>", '');

                var arrayOfLines = trk.match(/[^\r\n]+/g);

                var points = [];
                var accuracies = [];
                var lastPoint;

                for (var w = 0; w < arrayOfLines.length; w++) {
                    var line = arrayOfLines[w];
                    var lat = line.substring(
                        line.lastIndexOf('<trkpt lat="') + 12,
                        line.lastIndexOf('" lon="')
                    );
                    var ln = line.substring(
                        line.lastIndexOf('lon="') + 5,
                        line.lastIndexOf('"><time>')
                    );
                    var timestamp = line.substring(
                        line.lastIndexOf('<time>') + 6,
                        line.lastIndexOf('</time>')
                    );

                    var accuracy = line.substring(
                        line.lastIndexOf('<accuracy>') + 10,
                        line.lastIndexOf('</accuracy>')
                    );


                    // var valid = line.substring(
                    //     line.lastIndexOf('<valid>') + 7,
                    //     line.lastIndexOf('</valid>')
                    // );

                    let timestampLong = getMilliseconds(timestamp);

                    const dateObject = new Date(timestampLong);

                    var point = {
                        lat:parseFloat(lat),
                        ln:parseFloat(ln),
                        timestamp: timestampLong,
                        accuracy: accuracy,
                        valid: true
                    };
                    accuracies.push(accuracy);

                    let deltaD = 0;
                    let deltaT = 0;
                    if(!isUndefined(lastPoint)){
                        deltaD = calcCrow(point,lastPoint);
                        deltaT =  point.timestamp - lastPoint.timestamp;
                    }


                    let geometry = geometryByPlot[acrnByPlot[plot]];
                    let insidePlot = inside(point,geometry[0]);
                    // let validSpeed = deltaT === 0 || (deltaD/(deltaT*1000))<= 3;
                    // let validAccuracy = true;
                    //
                    // let valid = insidePlot && validSpeed && validAccuracy;

                    lastPoint = point;

                    //points.push(date+";"+ plot + ";" + parseFloat(lat) +";" +parseFloat(ln) +";" + dateObject.toLocaleString() +";" + deltaD + ";" + deltaT+ ";"+accuracy+";" + insidePlot);

                    points.push({
                        date:date,
                        plot:plot,
                        lat: parseFloat(lat),
                        ln: parseFloat(ln),
                        timestamp: getStringFormatedDate(dateObject),
                        deltaD: deltaD,
                        deltaT: deltaT,
                        accuracy: parseFloat(accuracy),
                        insidePlot: insidePlot,
                        valid: true
                    });
                }

                accuracies.sort();

                let index = Math.floor(0.95*accuracies.length);

                for(let w = 0; w < points.length; w++){
                    let validAccuracy = points[w].accuracy <= 5 || accuracies[index] >= points[w].accuracy;
                    let validSpeed = points[w].deltaT === 0 || (points[w].deltaD/(points[w].deltaT*1000))<= 3;
                    points[w].valid = points[w].insidePlot && validSpeed && validAccuracy
                }


                resolve(points);
            });
        }());
    });
}

let pointsPerVisit = {};

let MAX_DISTANCE = 3;
let MIN_STOPPED_TIME = 80000;

function detectStayPoints(locationData){
    let stayPoints = [];
    let i = 0;
    let pointNum = locationData.length;
    while(i < pointNum){
        let j = i + 1;
        let token = 0;
        let pi = locationData[i];
        while(j < pointNum){
            let pj = locationData[j];
            let distance = calcCrow(pi,pj);
            if(distance > MAX_DISTANCE){
                let timeVariation = pj.timestamp - pi.timestamp;
                if(timeVariation > MIN_STOPPED_TIME){
                    stayPoints.push(calculateStayPoint(locationData,i,j));
                    i = j;
                    token = 1;
                    break;
                }
            }
            j++;

        }
        if(token !== 1)
            i++;
    }

    return stayPoints;
}

function getStringFormatedDate(date_ob){
    let date = ("0" + date_ob.getDate()).slice(-2);

    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    let year = date_ob.getFullYear();

    let hours = ("0" + (date_ob.getHours())).slice(-2);

    let minutes = ("0" + (date_ob.getMinutes())).slice(-2);

    let seconds = ("0" + (date_ob.getSeconds())).slice(-2);

    console.log(year + "/" + month + "/" + date + " " + hours + ":" + minutes + ":" + seconds);
    return  (year + "/" + month + "/" + date + " " + hours + ":" + minutes + ":" + seconds +".000");
}
function calculateStayPoint(points, i,  j){
    let accLat = 0;
    let accLn = 0;
    let size = j - i + 1;

    for(let k = i; k <= j; k++){
        let point = points[k];
        accLat+=point.lat;
        accLn+=point.ln;
    }

    let stayPoint = {
        lat:accLat/size,
        ln:accLn/size,
        arrival: getStringFormatedDate(new Date(points[i].timestamp)),
        departure:  getStringFormatedDate(new Date(points[j].timestamp))
    };

    return stayPoint;
}


function pointToLineDist(p,a,b) {
    let center = {lat:0,ln:0};

    let lAx = {lat:a[1],ln:0};
    let lAy = {lat:0,ln:a[0]};
    let lBx = {lat:b[1],ln:0};
    let lBy = {lat:0,ln:b[0]};
    let lPx ={lat:p.lat,ln:0};
    let lPy = {lat:0,ln:p.ln};

    let ABx = calcCrow(lBx,lAx);
    let ABy = calcCrow(lBy,lAy);
    let APx = calcCrow(lPx,lAx);
    let APy = calcCrow(lPy,lAy);

    let AB_AP = ABx * APx + ABy * APy;
    let distAB2 = ABx * ABx + ABy * ABy;

    let Dx = calcCrow(center,lAx), Dy = calcCrow(center,lAy);
    if (distAB2 !== 0) {
        let t = AB_AP / distAB2;
        if (t >= 1) {
            Dx = calcCrow(center,lBx)
            Dy = calcCrow(center,lBy)
        } else if (t > 0) {
            Dx = calcCrow(center,lAx) + (ABx * t);
            Dy = calcCrow(center,lAy) + (ABy * t);
        } else {
            Dx = calcCrow(center,lAx)
            Dy = calcCrow(center,lAy)
        }
    }

    let PDx = Dx - calcCrow(center,lPx), PDy = Dy - calcCrow(center,lPy);
    return Math.sqrt(PDx * PDx + PDy * PDy);
}


/**
 * Get the shortest distance between a point and a polygon
 * @param point
 * @param points
 * @Return 0.0: The point is inside the polygon >0.0: The shortest distance between the point and the polygon
 */
function pintoToPolygonMinDist(point,points) {
    let dist = Number.MAX_VALUE;
    let N = points.length;
    for (let i = 0, j = N - 1; i < N; j = i++) {
        let newDistance = pointToLineDist(point, points[i], points[j]);
        dist = Math.min(dist, newDistance);
    }
    return dist;
}


function inside(point, vs) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

    var x = point.ln, y = point.lat;
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    if(inside)
        return true;
    else{
        return pintoToPolygonMinDist(point,vs) <= point.accuracy;
    }
};

function  checkPercentil(array,accuracy) {
    if(array.length < 10)
        return true;
    let index = Math.floor(0.95*array.length);
    return array[index] > accuracy;
}


function calcCrow(point1, point2)
{
    var R = 6371; // km
    var dLat = toRad(point2.lat-point1.lat);
    var dLon = toRad(point2.ln-point1.ln);
    var lat1 = toRad(point1.lat);
    var lat2 = toRad(point2.lat);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c * 1000;
    return d;
}

function toRad(Value)
{
    return Value * Math.PI / 180;
}

function  getMilliseconds(string_date) {
    return Date.parse(string_date);
}

function getGPX(file_id) {
    return new Promise((resolve ,reject)=> {

        (function () {
            gapi.client.drive.files.get({
                'fileId': file_id,
                'alt': 'media',
            }).then(function (response) {
                var gpx = response.body;

                var points = [];

                var wayPoints = [];


                var wpts = gpx.substring(
                    gpx.indexOf("<wpt "),
                    gpx.lastIndexOf("</wpt>")
                );
                var wpts_array = wpts.split("<wpt ");
                for (var k = 0; k < wpts_array.length; k++) {
                    var line = wpts_array[k];
                    if (line !== "") {
                        var file_name = line.substring(
                            line.lastIndexOf('<name>') + 6,
                            line.lastIndexOf('</name>')
                        );
                        var lat = line.substring(
                            line.lastIndexOf('lat="') + 5,
                            line.lastIndexOf('" lon="')
                        );
                        var ln = line.substring(
                            line.lastIndexOf('lon="') + 5,
                            line.lastIndexOf('"><time>')
                        );

                        var file_type;
                        if (file_name.includes("photo"))
                            file_type = 0;
                        else if (file_name.includes("audio"))
                            file_type = 1;
                        else file_type = 2;

                        if (file_type === 0) {
                            locationByFile[file_name] = {
                                longitude: parseFloat(ln),
                                latitude: parseFloat(lat)
                            };
                            console.log(file_name);

                        }
                    }


                }
                resolve(true);
            });
        }());
    });
}

function getPhotos(id){
    return new Promise((resolve ,reject)=> {

        gapi.client.drive.files.list({
            'folderId': id,
            'pageSize': 100,
            'fields': "nextPageToken, files(id, name, description, properties,owners)",
            'q': `'${id}' in parents`
        }).then(function (response) {
            var files = response.result.files;
            if (files && files.length > 0) {
                for (var i = 0; i < files.length; i++) {
                    (function () {

                        var id = files[i].id;
                        var name = files[i].name;
                        var description = files[i].description;
                        var observation = getObservationText(files[i].properties);

                        if((!isUndefined(observation) && observation.includes("Armadilha: ")) || (!isUndefined(description) && description.toLowerCase().includes("armadilha"))){
                            files_info[name] = {description: description, observation: observation, id: id};
                            console.log(name);
                        }
                    })();
                }
                resolve(true);
            }else
                resolve(false);
        });
    });
}

function getLogs(id,date,plot){
    return new Promise((resolve ,reject)=> {

        gapi.client.drive.files.list({
            'folderId': id,
            'pageSize': 10,
            'fields': "nextPageToken, files(id)",
            'q': `'${id}' in parents`
        }).then(function (response) {
            var files = response.result.files;
            if (files && files.length > 0) {

                    var log_id = files[0].id;
                    gapi.client.drive.files.get({
                        'fileId': log_id,
                        'alt': 'media',
                    }).then(function (response) {
                        let splitedBody = response.body.split("\n");
                        let processed = "";
                        for(let i = 0; i < splitedBody.length; i++){
                            let line = splitedBody[i];
                            if(line.includes("clickedEOI") || line.includes("data")){
                                let type = line.includes("clickedEOI") ? "clickedEOI" : "protocolData";
                                let timestamp =  line.substr(0,
                                    line.indexOf("/Info")
                                )
                                timestamp = timestamp.replace(" 01:"," 13:");
                                timestamp = timestamp.replace(" 02:"," 14:");
                                timestamp = timestamp.replace(" 03:"," 15:");
                                timestamp = timestamp.replace(" 04:"," 16:");
                                timestamp = timestamp.replace(" 05:"," 17:");
                                timestamp = timestamp.replace(" 06:"," 18:");

                                let value;
                                if(line.includes("clickedEOI"))
                                    value= line.split(" ")[4];
                                else
                                    value = line.substring(
                                        line.indexOf("data = ") + 7,
                                        line.length
                                    );

                                if(processed !== "")
                                    processed+= '\n';
                                processed += date+";"+plot+";"+type+";"+value +";"+timestamp;
                            }
                        }
                        resolve(processed);
                    });
            }
        });
    });
}

function listVisits(fileID) {
    gapi.client.drive.files.list({
        'folderId' : fileID,
        'pageSize': 100,
        'fields': "nextPageToken, files(id, name, owners)",
        'q': `'${fileID}' in parents`
    }).then(function(response) {
        var files = response.result.files;
        for(var i = 0; i < files.length; i++){
            if(files[i].name !== "info.csv"){
                let deviceId = files[i].id;
                gapi.client.drive.files.list({
                    'folderId' : deviceId,
                    'pageSize': 1000,
                    'fields': "nextPageToken, files(id, name)",
                    'q': `'${deviceId}' in parents`
                }).then(function(response) {
                    let visit_folders = response.result.files;
                    recursive(visit_folders,0);
                    // for(let w = 0; w < visit_folders.length; w++) {
                    //     let visit = visit_folders[w];
                    //     iterateVisit(visit).then((res) => {
                    //         console.log("Resolved");
                    //
                    //     }).catch((error) => {
                    //         console.log(error.toString());
                    //     });
                    // }
                });
            }
        }

    });
}

function recursive(collection, counter){
    let visit = collection[counter];
    iterateVisit(visit).then((res) => {
        //console.log("Resolved");
        counter++;
        console.log(counter);

        if(counter < collection.length){
            recursive(collection,counter);
        }
    }).catch((error) => {
        console.log(error.toString());
    });
}

let csvInfo = [];
let logs = [];
function iterateVisit(visit){
    return new Promise((resolve ,reject)=>{
        if(visit.name.includes("2021")){
            let date = visit.name.substr(0,10);
            let auxSplit = visit.name.split('.');
            let plot = auxSplit[auxSplit.length -1];
            gapi.client.drive.files.list({
                'folderId' : visit.id,
                'pageSize': 20,
                'fields': "nextPageToken, files(id, name)",
                'q': `'${visit.id}' in parents `
            }).then(function(response) {
                let visit_files = response.result.files;
                let gpsId;
                let jsonId;
                let photosId;
                for (let j = 0; j < visit_files.length; j++) {
                    let file = visit_files[j];
                    // if(file.name.includes("Logs")){
                    //     getLogs(file.id,date,plot).then((res) => {
                    //         if(res !== "")
                    //             logs.push(res);
                    //         console.log(res);
                    //     }).catch((error)=>{
                    //         console.log(error);
                    //     });
                    // }
                    //
                    // if(file.name.includes("gpx")){
                    //     getGPXForLogs(file.id,date,plot).then((res) => {
                    //         for(let j = 0; j < res.length; j++){
                    //             let point = res[j];
                    //             console.log(point);
                    //             logs.push(date+";"+plot+";"+"gpsPoint" +";" + JSON.stringify(point) +";"+ point.timestamp);
                    //             resolve(true);
                    //         }
                    //         console.log(res);
                    //     }).catch((error) => {
                    //         console.log("ERROR");
                    //     });
                    // }
                    // if(file.name.includes("gpx")){
                    //     getGPX2(file.id,date,plot).then((res) => {
                    //         console.log(res);
                    //         for(let i = 0 ; i < res.length; i++)
                    //             csvInfo.push(res[i]);
                    //         resolve(true);
                    //
                    //     }).catch((error) => {
                    //         console.log("ERROR");
                    //     });
                    // }
                    if (file.name.includes("gpx"))
                        gpsId = file.id;
                    else if (file.name.includes("Photos"))
                        photosId = file.id;
                    else if (file.name.includes("visit_json"))
                        jsonId = file.id;

                    // if(file.name.includes("gpx")){
                    //     getGPXForStayPoint(file.id,date,plot).then((res) => {
                    //         console.log(res);
                    //         pointsPerVisit[date +"_"+plot] = res;
                    //         resolve(true);
                    //     }).catch((error) => {
                    //         console.log("ERROR");
                    //     });
                    // }

                    // if(file.name.includes("visit_json")){
                    //     getNumberOfEoisWithValue(file.id,date,plot).then((res) => {
                    //         console.log(res);
                    //         csvInfo.push(res);
                    //
                    //     }).catch((error) => {
                    //         console.log("ERROR");
                    //     });
                    //     break;
                    // }
                }


                if (isUndefined(jsonId))
                    resolve(false);
                else {
                    getTrapValues(jsonId, date, plot).then((res) => {
                        console.log(res);

                        if (!isUndefined(photosId)) {
                            getPhotos(photosId).then((res) => {
                                console.log(res);
                                if (!isUndefined(gpsId)) {
                                    getGPX(gpsId, date, plot).then((res) => {
                                        console.log(res);
                                        resolve(true);
                                    }).catch((error) => {
                                        console.log("ERROR");
                                    });
                                }else
                                    resolve(true);
                            }).catch((error) => {
                                console.log("ERROR");
                            });
                        } else
                            resolve(false);
                    }).catch((error) => {
                        console.log("ERROR");
                    });
                }
            });
        }
    });
}

function getTrapValues(file,date,plot){
    return new Promise((resolve ,reject)=> {
        var BreakException = {};
        (function () {
            gapi.client.drive.files.get({
                'fileId': file,
                'alt': 'media',
            }).then(function (response) {
                let visitJson = response.body;
                visitJson = JSON.parse(visitJson);
                let traps = visitJson['traps'];
                let  trapsForVisit = {};
                if(!isUndefined(traps)) {
                    Object.keys(traps).sort().forEach(function (trap) {
                        let trapObject = traps[trap];
                        trapsForVisit[trap] = trapObject['value'];
                    });
                }
                console.log(date);
                trap_count[date+"_"+plot] = trapsForVisit;

                resolve(true);
            });
        }());
    });
}
function getNumberOfEoisWithValue(file,date,plot){
    return new Promise((resolve ,reject)=> {
        var BreakException = {};
        (function () {
            gapi.client.drive.files.get({
                'fileId': file,
                'alt': 'media',
            }).then(function (response) {
                let visitJson = response.body;
                visitJson = JSON.parse(visitJson);
                let eois = visitJson['eois'];
                let counter = 0;
                if(!isUndefined(eois)) {
                    Object.keys(eois).sort().forEach(function (eoi) {
                        let found = false;
                        let protocols = eois[eoi];
                        try {
                            Object.keys(protocols).sort().forEach(function (protocol) {
                                let observations = protocols[protocol];
                                Object.keys(observations).sort().forEach(function (observation) {
                                    let components = observations[observation];
                                    Object.keys(components).sort().forEach(function (index) {
                                        let component = components[index];
                                        if (component['value'] === "1" || component['value'] === "true") {
                                            found = true;
                                            throw BreakException;
                                        }
                                    });
                                });
                            });
                        } catch (e) {
                            if (e !== BreakException) throw e;
                        }

                        if (found)
                            counter++;
                    });
                }
                resolve(date +";"+plot +";"+ "João" +";"+counter);
            });
        }());
    });
}

// function iterateVisit(visit){
//     return new Promise((resolve ,reject)=>{
//         if(visit.name.includes("2021.05.31") || visit.name.includes("2021.06.02")){
//             gapi.client.drive.files.list({
//                 'folderId' : visit.id,
//                 'pageSize': 20,
//                 'fields': "nextPageToken, files(id, name)",
//                 'q': `'${visit.id}' in parents `
//             }).then(function(response) {
//                 let visit_files = response.result.files;
//                 for(let j = 0; j <visit_files.length; j++){
//                     let file = visit_files[j];
//                     if(file.name.includes("gpx")){
//                         getGPX(file.id).then((res) => {
//                             console.log("Resolved");
//
//                         }).catch((error) => {
//                             console.log("Rejected");
//                         });
//                     }else if(file.name === "Photos"){
//                         getPhotos(file.id).then((res) => {
//                             console.log("Resolved");
//
//                         }).catch((error) => {
//                             console.log("Rejected");
//                         });
//                     }
//                 }
//                 resolve(true);
//             });
//         }else
//             reject(false);
//     });
// }

function isUndefined(object){
    return typeof object === "undefined";
}

function getObservationText(infoJSON){
    if(infoJSON != null && !isUndefined(infoJSON)) {
        let processedObservation = null;
        try {
            if (!isUndefined(infoJSON["eoi"])) {
                let message = "Árvore " + (parseInt(infoJSON["eoi"]) + 1) + " " + infoJSON["protocol_name"] + ": " + infoJSON["observation_name"];
                if(!isUndefined(infoJSON["title"]))
                    message+= " - " + infoJSON["title"];
                processedObservation = message;
            }else if(!isUndefined(infoJSON["title"])){
                processedObservation ="Armadilha: " + infoJSON["title"];
            }else if(!isUndefined(infoJSON["occurrence_type"])){
                let occ_type = parseInt(infoJSON["occurrence_type"]) === 0 ? "Ação: " : "Evento: ";
                processedObservation = occ_type + infoJSON["occurrence_name"];

            }
            return processedObservation;

        } catch (e) {
            return undefined;
        }

    }
    return undefined
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        //getPlotPolygon();
        listVisits("1DVh3p1qgUFgy1H0_9vKHe9jwBfYPX4TS");


    } else {
        alert("A sessão expirou, a voltar à página inicial.");
        window.location.href = "index.html";
    }
}

function getCSV() {
    let all = header;

    // console.log(pointsPerVisit);
    Object.keys(pointsPerVisit).sort().forEach(function (visit) {
        let stayPointList = pointsPerVisit[visit];
        let splittedKey = visit.split("_");
        for(let i = 0; i< stayPointList.length; i++){
            let stayPoint = stayPointList[i];
            all += '\n';
            all += splittedKey[0] +";" + splittedKey[1] + ";" + stayPoint.lat +";" + stayPoint.ln + ";" + stayPoint.arrival + ";" + stayPoint.departure;
        }
    });

    // for(let j = 0; j<csvInfo.length;j++){
    //     let point = csvInfo[j];
    //     all+='\n';
    //     //points.push(date+";"+ plot + ";" + parseFloat(lat) +";" +parseFloat(ln) +";" + dateObject.toLocaleString() +";" + deltaD + ";" + deltaT+ ";"+accuracy+";" + insidePlot);
    //
    //     all += point.date+";"+point.plot+ ";"+ point.lat +";" + point.ln + ";" + point.timestamp +";" + point.deltaD + ";" + point.deltaT +";" + point.accuracy +";" + point.insidePlot +";" + point.valid;
    // }

    // for(let j = 0; j<logs.length;j++){
    //     all+='\n';
    //     all+= logs[j];
    // }
    console.log(all);
}
function getCSVMaria(){
    let all = header;
    Object.keys(files_info).sort().forEach(function(file_name) {
        let splited_name = file_name.split("_");

        let fileLocation = locationByFile[file_name];
        let plot = splited_name[1];
        let userName = splited_name[2];

        let time = splited_name[splited_name.length -1];
        let hour = time.substring(0, 2);
        let min = time.substring(2, 4);

        let timedate = splited_name[splited_name.length -2];
        let year = timedate.substring(0, 4);
        let month = timedate.substring(4, 6);
        let day = timedate.substring(6, 8);

        let completeDate = `${day}/${month}/${year} ${hour}:${min}`;

        let lat;
        let ln;
        if(!isUndefined(fileLocation)){
            lat = fileLocation.latitude;
            ln = fileLocation.longitude;
        }


        let description = files_info[file_name].description;
        let observation = files_info[file_name].observation;
        let file_id = files_info[file_name].id;
        let trapCount = undefined;
        if(!isUndefined(observation)){
            let aux = observation.replace("Armadilha: ","");
            console.log(timedate);
            let identifier = year+"."+month+"."+day+"_"+plot;
            if(!isUndefined(trap_count[identifier]))
                trapCount = trap_count[identifier][aux];
        }

        let link = 'https://drive.google.com/file/d/'+ file_id;

        all+= `\n${userName};${plot};${completeDate};${file_name};${lat};${ln};${description};${observation};${trapCount};${link}`;

    });
    console.log(all);

}

let geometryByPlot = {};
let acrnByPlot = {};

function getPlotPolygon() {
    fetch("./resources/json/parcelas.json").then(function(response) {
        response.text().then(function(body1) {
            fetch("./resources/json/region_info.json").then(function(response) {
                response.text().then(function(body2) {
                    let plots_jsons = JSON.parse(body1);
                    for(var j = 0; j < plots_jsons.features.length; j++) {
                        var idparcela = plots_jsons.features[j].properties['nomeparcela'];
                        geometryByPlot[idparcela] = plots_jsons.features[j].geometry.coordinates;
                    }

                    let region_info = JSON.parse(body2);
                    for(var j = 0; j < region_info.length; j++) {
                        acrnByPlot[region_info[j].codigo] =region_info[j].parcela;
                    }

                    console.log(acrnByPlot);
                    console.log(geometryByPlot);

                    listVisits("1pZ_DmsrIO-ps877UF__2KzIotbyz9dkh");

                });
            });
        });
    });


}
function getVisitResumeObject(json){
    console.log(json);

    let resume = {};
    resume['plot'] = json['region_code'];
    resume['plotName'] = "Quinta do Brejo"; //TODO
    resume['crops'] = "Pera"; //TODO
    resume['date'] = json['visit_date'].replace("-","/");
    resume['tBegin'] = "13:10"; //TODO
    resume['numPhotos'] = 0; //TODO
    resume['numVoice'] = 0; //TODO
    resume['technicians'] = json['agente']; //array?
    resume['treatment'] = json['tratamento'];
    resume['rain'] = json['chuva'];
    resume['caliber'] = json['calibre'];
    resume['gps'] = true; //TODO  true se houver sinal gps
    resume['ef'] = json['ef'];
    resume['nea'] = json['nea'];
    resume['notes'] = json['notas'];
    resume['visited'] = true; //TODO flag que indica se a visita foi realizada e não "cancelada"

    let protocols = json['protocolos'];
    let traps = json['armadilhas'];
    let protocolsOverall = "";
    let trapsOverall = "";

    for(let i = 0; i < protocols.length; i++){
        let protocolObject = protocols[i];
        if(protocolObject['valor_soma'] > 0){
            if(protocolsOverall !== "")
                protocolsOverall += " / ";
            protocolsOverall += protocolObject['valor_soma'] +"/20" + protocolObject['nome_protocolo'];
        }
    }

    for(let i = 0; i < traps.length; i++){
        let protocolObject = traps[i];
        if(protocolObject['valor_soma'] > 0){
            if(trapsOverall !== "")
                trapsOverall += " / ";
            trapsOverall += protocolObject['valor_soma'] +"/20" + protocolObject['nome_protocolo'];
        }
    }

    resume['overall'] = protocolsOverall + " // " + trapsOverall;

    console.log(resume);
}


//let header = "Technician;POB;Data;Photo;Lat;Ln;Description;Observation";
//let header = "date,pob,technicians,n_points,avgDistance,min_distance,max_distance,avg_time,mine_time,max_time";
//let header = "date;pob;type;value;timestamp";
//let header = "date;pob;lat;ln;timestamp;deltaD;deltaT;accuracy;insidePlot;valid";
//let header = "date;pob;technicians;eoisWithObservations";
//let header = "date;pob;lat;ln;arrival;departure";

let header = "Technician;POB;Data;Photo;Lat;Ln;Description;Observation;Count;Link";

var files_info = {};
var locationByFile = {};
var trap_count = {};

var CLIENT_ID = '697021054229-c7jjbfpfmjkrnoqjo2pg7nfj7v1a1f95.apps.googleusercontent.com';

var API_KEY = 'AIzaSyCMSb0abab-1ALwctezS4mWo8AalLXI9KI';

var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

var SCOPES = 'https://www.googleapis.com/auth/drive';

// fetch('http://94.23.61.125/api/regionsinperiods/visitsummary?region_code=VL&visit_date=2021-04-14')
//     .then(response => response.json())
//     .then(data => getVisitResumeObject(data));
