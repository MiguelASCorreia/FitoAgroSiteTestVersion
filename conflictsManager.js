function changePage(page){
    if (confirm("Pretende cancelar a resolução do conflito?")) {
        window.location.href = page;
    }
}

function onNoteModalClose(){
    document.getElementById('confirm_modal').style.display = 'none';
    document.getElementById('confirmationTable').innerHTML = "";
}


//concatena o body original com os conflitos resolvidos
function getNewBody(oldBody){
    console.log(oldBody);
    console.log(definitiveEois);

    Object.keys(definitiveEois).forEach(function (eoi) {
        Object.keys(definitiveEois[eoi]).forEach(function (protocol) {
            Object.keys(definitiveEois[eoi][protocol]).forEach(function (obs) {
                Object.keys(definitiveEois[eoi][protocol][obs]).forEach(function (component1) {
                    let description = definitiveEois[eoi][protocol][obs][component1]['description'];
                    Object.keys(oldBody['eois'][eoi][protocol][obs]).forEach(function (component2) {
                        if(oldBody['eois'][eoi][protocol][obs][component2]["description"] === description)
                            oldBody['eois'][eoi][protocol][obs][component2] = definitiveEois[eoi][protocol][obs][component1];
                    });

                });
            });
        });
    });

    Object.keys(definitiveTraps).forEach(function (trap) {
        oldBody['traps'][trap] = definitiveTraps[trap];
    });

    Object.keys(definiteInfo).forEach(function (info) {
        oldBody['info']["Default_observations"][info] = definiteInfo[info];
    });

    if(notesJson !== ''){
        oldBody['info']["Default_observations"]['Notas'] = {owners: users,type:2, value: notesJson};
    }

    oldBody['state'] = 1;

    return oldBody;
}




function generateTableHead(table, data) {
    let thead = table.createTHead();
    let row = thead.insertRow();

    let th = document.createElement("th");
    let text = document.createTextNode("Conflito");
    th.appendChild(text);
    th.style.paddingLeft = '10px';
    row.appendChild(th);

    for (let key of data) {
        let th = document.createElement("th");
        let text = document.createTextNode(key);
        th.appendChild(text);
        th.style.textAlign = 'center';
        row.appendChild(th);
    }
}
function generateConfirmTableRows(table, conflicts) {
    let success = true;
    Object.keys(conflicts).sort().forEach(function(obName) {
        let row = table.insertRow();
        let value;
        var shownObText = obName;
        var aux = shownObText.split("_");
        if(aux[0] === "Armadilha") {
            shownObText = "Armadilha: " + aux[1];
            value = definitiveTraps[aux[1]]['value'];
        }
        else if(aux[0] === "Info") {
            shownObText = aux[1];
            value = definiteInfo[aux[1]]['value']
        }
        else{
            //eoi
            if(aux[2] !== aux[3])
                shownObText = "Arv." + (parseInt(aux[0])+1) + ", " + aux[1] + ", " + aux[2] + ": " + aux[3];
            else
                shownObText = "Arv." + (parseInt(aux[0])+1) + ", " + aux[1] + ": " + aux[2];

            let components = definitiveEois[aux[0]][aux[1]][aux[2]];
            for(let w = 0; w < components.length; w++){
                if(components[w]['description'] === aux[3]){
                    value = components[w]['value'];
                    break;
                }
            }
        }

        let conflictText = document.createTextNode(shownObText);
        let cell = row.insertCell();
        cell.style.textAlign = 'left';
        cell.appendChild(conflictText);
        cell.style.paddingLeft = '10px';

        if(isUndefined(value)) {
            console.log("ValueIsUndefined");
            success = false;
        }

        if( value === "true")
            value = "Sim";
        else if( value === "false")
            value = "Não";


        let valueText = document.createTextNode(value);
        let valueCell = row.insertCell();
        valueCell.style.textAlign = 'center';
        valueCell.appendChild(valueText);
    });

    return success;


}

function generateTableRows(table, conflicts,conflictedComponents, usersName){

    Object.keys(conflicts).sort().forEach(function(obName) {

        let row = table.insertRow();
        let cell = row.insertCell();
        var shownObText = obName;
        var aux = shownObText.split("_");
        if(aux[0] === "Armadilha")
            shownObText = "Armadilha: " + aux[1];
        else if(aux[0] === "Info")
            shownObText = aux[1];
        else{
            //eoi
            if(aux[2] !== aux[3])
                shownObText = "Arv." + (parseInt(aux[0])+1) + ", " + aux[1] + ", " + aux[2] + ": " + aux[3];
            else
                shownObText = "Arv." + (parseInt(aux[0])+1) + ", " + aux[1] + ": " + aux[2];

        }

        let valueText = document.createTextNode(shownObText);
        cell.style.textAlign = 'left';
        cell.appendChild(valueText);
        cell.style.paddingLeft = '10px';


        Object.keys(conflicts[obName]).sort().forEach(function(position) {
            let radioButton = document.createElement("input");
            let inputId = obName +"_"+ usersName[position];

            var eoi;
            var protocol;
            var observation;
            var description;

            var trap;

            var info;

            let aux = obName.split("_");
            if(aux[0] === "Armadilha")
                trap = aux[1];
            else if(aux[0] === "Info")
                info = aux[1];
            else{
                eoi = aux[0];
                protocol = aux[1];
                observation = aux[2];
                description = aux[3];
            }

            radioButton.type = "radio";
            radioButton.name = obName;
            radioButton.id = inputId;
            radioButton.value = conflicts[obName][position];
            radioButton.addEventListener('change', function() {
                console.log(obName + ": " + this.value);
                console.log(conflicts[obName]);

                if(!isUndefined(eoi)){
                    conflictedComponents[obName]['owners'] = usersName;
                    conflictedComponents[obName]['value'] = this.value;

                    if(isUndefined(definitiveEois[eoi]))
                        definitiveEois[eoi] = {};
                    if(isUndefined(definitiveEois[eoi][protocol]))
                        definitiveEois[eoi][protocol] = {};
                    if(isUndefined(definitiveEois[eoi][protocol][observation]))
                        definitiveEois[eoi][protocol][observation] = [];

                    let found = false;
                    for(let w = 0 ; w< definitiveEois[eoi][protocol][observation].length; w++){
                        if(definitiveEois[eoi][protocol][observation][w]['description'] === description){
                            console.log("FOUND")
                            definitiveEois[eoi][protocol][observation][w] = conflictedComponents[obName];
                            found = true;
                            break;
                        }
                    }
                    if(!found) {
                        console.log("NOT FOUND")
                        definitiveEois[eoi][protocol][observation].push(conflictedComponents[obName]);
                        console.log(definitiveEois)
                    }






                }else if(!isUndefined(trap)){
                    conflictedComponents[obName]['owners'] = usersName;
                    conflictedComponents[obName]['value'] = this.value;
                    definitiveTraps[trap] = conflictedComponents[obName];

                }else if(!isUndefined(info)){
                    conflictedComponents[obName]['owners'] = usersName;
                    conflictedComponents[obName]['value'] = this.value;
                    definiteInfo[info] = conflictedComponents[obName];
                }


            });

            let label = document.createElement("label");
            label.setAttribute("for",inputId);
            label.style.marginLeft = '5px';
            if( radioButton.value === "true")
                label.innerHTML = "Sim";
            else if( radioButton.value === "false")
                label.innerHTML = "Não";
            else
                label.innerHTML = radioButton.value;

            let cell = row.insertCell();
            cell.style.textAlign = 'center';
            cell.appendChild(radioButton);
            cell.appendChild(label);

        });
    });
}


function detectConflict(jsonsPerUser){
    //as notas são concatenadas e os técnicos tambem

    users = Object.keys(jsonsPerUser);

    var conflictedComponents = {};

    var actualUser = 0;
    for(actualUser = 0 ;  actualUser < users.length; actualUser++){

        var defaultUser = users[actualUser];
        var defaultJson = jsonsPerUser[defaultUser];
        var userEOI = defaultJson["eois"];
        var userTrap = defaultJson["traps"];
        var userInfo = defaultJson["info"]["Default_observations"];

        for(var otherUser = actualUser +1; otherUser < users.length; otherUser++){
            var otherJson = jsonsPerUser[users[otherUser]];
            var otherUserEoi = otherJson["eois"];
            var otherUserTrap = otherJson["traps"];
            var otherUserInfo = otherJson["info"]["Default_observations"];

            //EOIS

            Object.keys(otherUserEoi).forEach(function (eoi) {
                let protocolsOnEoi = otherUserEoi[eoi];
                Object.keys(protocolsOnEoi).forEach(function (protocol) {
                    let observationsOnProtocol = protocolsOnEoi[protocol];
                    Object.keys(observationsOnProtocol).forEach(function (obs) {
                        let componentPerObservation = observationsOnProtocol[obs];
                        Object.keys(componentPerObservation).forEach(function (component1) {
                            let componentData = componentPerObservation[component1];

                            let description = componentData["description"];
                            let value = componentData["value"];

                            try {
                                Object.keys(userEOI[eoi][protocol][obs]).forEach(function (component2) {
                                    var userComponentData = userEOI[eoi][protocol][obs][component2];

                                    if(userComponentData["description"] === description){
                                        if(userComponentData["value"] !== value){
                                            let conflictName = eoi+"_"+protocol+"_"+obs+"_"+description;
                                            if(isUndefined(conflicts[conflictName]))
                                                conflicts[conflictName] = {};
                                            console.log(actualUser + " vs " +otherUser);
                                            conflicts[conflictName][actualUser] = userComponentData["value"];
                                            conflicts[conflictName][otherUser] = value;
                                            conflictedComponents[conflictName] = userComponentData;
                                        }
                                    }

                                });
                            }catch (e) {
                                console.log("Observation not found: " + e);
                            }


                        });
                    });
                });
            });


            //TRAPS
            Object.keys(otherUserTrap).forEach(function (trap) {
                let value = otherUserTrap[trap]['value'];
                if(isUndefined(userTrap[trap]) || userTrap[trap]['value'] !== value){
                    let trapName = "Armadilha_" + trap;
                    if(isUndefined(conflicts[trapName]))
                        conflicts[trapName] = {};
                    conflicts[trapName][actualUser] = userTrap[trap]['value'];
                    conflicts[trapName][otherUser] = value;
                    conflictedComponents[trapName] = userTrap[trap];

                }
            });

            //INFO

            if(otherUserInfo["EF"]["value"] !== userInfo["EF"]["value"]){
                if(isUndefined(conflicts["Info_EF"]))
                    conflicts["Info_EF"] = {};
                conflicts["Info_EF"][actualUser] = userInfo["EF"]["value"];
                conflicts["Info_EF"][otherUser] = otherUserInfo["EF"]["value"];
                conflictedComponents["Info_EF"] = otherUserInfo["EF"];

            }

            if(otherUserInfo["Chuva"]["value"] !== userInfo["Chuva"]["value"]){
                if(isUndefined(conflicts["Info_Chuva"]))
                    conflicts["Info_Chuva"] = {};
                conflicts["Info_Chuva"][actualUser] = userInfo["Chuva"]["value"];
                conflicts["Info_Chuva"][otherUser] = otherUserInfo["Chuva"]["value"];
                conflictedComponents["Info_Chuva"] = otherUserInfo["Chuva"];

            }

            if(otherUserInfo["Tratamento"]["value"] !== userInfo["Tratamento"]["value"]){
                if(isUndefined(conflicts["Info_Tratamento"]))
                    conflicts["Info_Tratamento"] = {};
                conflicts["Info_Tratamento"][actualUser] = userInfo["Tratamento"]["value"];
                conflicts["Info_Tratamento"][otherUser] = otherUserInfo["Tratamento"]["value"];
                conflictedComponents["Info_Tratamento"] = otherUserInfo["Tratamento"];

            }

            if((isUndefined(otherUserInfo["Calibre"]) ^ isUndefined(userInfo["Calibre"])) || (!isUndefined(otherUserInfo["Calibre"]) && !isUndefined(userInfo["Calibre"]) && otherUserInfo["Calibre"]["value"] !== userInfo["Calibre"]["value"])){
                if(isUndefined(conflicts["Info_Calibre"]))
                    conflicts["Info_Calibre"] = {};

                if(isUndefined(userInfo["Calibre"]))
                    conflicts["Info_Calibre"][actualUser] = "0";
                else
                    conflicts["Info_Calibre"][actualUser] = userInfo["Calibre"]["value"];

                if(isUndefined(otherUserInfo["Calibre"]))
                    conflicts["Info_Calibre"][otherUser] = "0";
                else
                    conflicts["Info_Calibre"][otherUser] = otherUserInfo["Calibre"]["value"];

                conflictedComponents["Info_Calibre"] = otherUserInfo["Calibre"];

            }

            if(!isUndefined(otherUserInfo["Notas"]) || !isUndefined(userInfo["Notas"])){
                if(!isUndefined(otherUserInfo["Notas"])){
                    if(notesJson.indexOf(otherUserInfo["Notas"]['value']) === -1)
                        notesJson += otherUserInfo["Notas"]['value'] +'\n';
                }

                if( !isUndefined(userInfo["Notas"])){
                    if(notesJson.indexOf(userInfo["Notas"]['value']) === -1)
                        notesJson += userInfo["Notas"]['value'] +'\n';
                }
            }
        }
    }

    console.log(conflictedComponents);

    let table = document.getElementById("table");

    generateTableRows(table,conflicts,conflictedComponents,users);
    generateTableHead(table,users);

}

function isUndefined(object){
    return typeof object === "undefined";
}

function showLogs() {
        let confirmTable = document.getElementById('confirmationTable');
        try {
            confirmTable.innerHTML = "";
            let success = generateConfirmTableRows(confirmTable, conflicts);
            console.log(success);
            if(!success){
                confirmTable.innerHTML = "";
                alert("Resolva todos os conflitos primeiro!")

            }else {
                generateTableHead(confirmTable, ["Valores"]);
                document.getElementById('confirm_modal').style.display = 'block';
            }
        }catch (e) {
            alert("Resolva todos os conflitos primeiro!")
        }
        console.log(definitiveEois);
        console.log(definitiveTraps);
        console.log(definiteInfo);

}

function getVisitJSON(folderId){
    return new Promise((resolve ,reject)=>{
        var visit_json;
        var visit_version = 0;
        gapi.client.drive.files.list({
            'folderId': folderId,
            'pageSize': 100,
            'fields': "nextPageToken, files(id, name, mimeType)",
            'q': `name contains 'visit_json.txt' and '${folderId}' in parents`
        }).then(function (response) {
            var files = response.result.files;
            if (files && files.length > 0) {

                for (var i = 0; i < files.length; i++) {
                    (function () {
                        var fileName = files[i].name;
                            var fileVersion = parseInt(fileName.split('.')[0][1]);
                            //console.log(fileVersion);
                            if (fileVersion > visit_version) {
                                visit_version = fileVersion;
                                visit_json = files[i].id;
                            }
                    })();
                }

                getVisitBody(visit_json).then((res) => {
                    let result= {
                        'file_id':visit_json,
                        'file_version':visit_version,
                        "parent":folderId,
                        'body': res
                    };
                    resolve(result);
                }).catch((error) => {
                    reject("Rejected");
                });
            }else
                reject("Rejected");
        });
    });
}


function getVisitBody(visitId){
    return new Promise((resolve ,reject)=>{

        if(visitId == null)
            reject("Rejected");

        gapi.client.drive.files.get({
            'fileId': visitId,
            'alt': 'media',
        }).then(function(response) {
            resolve(response.body);
        });
    });
}

function iterateVisits(fileJsons){
return new Promise((resolve ,reject)=> {
    let done = 0;
    let found = 0;
        for(let i = 0; i< folderIds.length; i++){
            let folderId = folderIds[i];
            getVisitJSON(folderId).then((res) => {
                done++;
                fileJsons.push(res);
                let bodyJson = JSON.parse(res['body']);
                if(!isUndefined(bodyJson['state']) && bodyJson['state'] === 1){
                    found++;
                }
                if(done >= folderIds.length){
                    resolve(found)
                }
            }).catch((error) => {
                done++;
                if(done >= folderIds.length){
                    resolve(found)
                }
            });
        }
    });
}

function writeFiles(fileJsons, success){
    return new Promise((resolve ,reject)=> {
        let done = 0;
        let success = 0;
        for(let i = 0; i < fileJsons.length; i++){
            let file = fileJsons[i];
            let name = 'V'+(file['file_version']+1) + ".visit_json.txt";
            createJSON(name,JSON.stringify(getNewBody(JSON.parse(fileJsons[i]['body']))),fileJsons[i]['parent']).then((res) => {
                done++;
                if(res['status'] === 200)
                    success++;
                console.log(res);
                if(done >= folderIds.length){
                    resolve(success)
                }
            }).catch((error) => {
                done++;
                console.log(error);
                if(done >= folderIds.length){
                    resolve(success)
                }
            });
        }
    });
}

function complete(){
    let fileJsons = [];
    let found = 0;
    let success = 0;
    folderIds[0] = '1x9roH3KjTJ-nUiti2M6QlmzQCwn1vcgo';
    iterateVisits(fileJsons).then((res) => {
        console.log(fileJsons);
        found = res;
        if(found === folderIds.length){
            alert("O conflito já foi resolvido por outro utilizador.")
            window.location.href = "index.html";
            return;
        }

        writeFiles(fileJsons).then((res) => {
            success = res;
            if(success === folderIds.length) {
                alert("Conflito resolvido com sucesso.");
                window.location.href = "index.html";
            }else{
                alert("Ocorreu um erro, não foi possível resolver o conflito!");
                window.location.href = "index.html";
            }
        }).catch((error) => {
            console.log(error);
        });



    }).catch((error) => {
        console.log("Rejected");
    });

}

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

function createJSON(name,data,parent) {
    return new Promise((resolve ,reject)=> {

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const contentType = 'text/plain';

        var metadata = {
            'name': name,
            'mimeType': contentType,
            'parents': [parent]
        };

        var multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n\r\n' +
            data +
            close_delim;

        gapi.client.request({
            'path': '/upload/drive/v3/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        }).then(function (response) {
            resolve(response);


        }, function (error) {
            reject(error);
        });
    });
}


function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        var currentUser = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
        fullName = currentUser.getName();
        let userName = document.getElementById("user_name");
        userName.innerHTML = fullName;
        userName.style.display = 'inline-block';

        document.getElementById('confirm').style.display = 'block';

    } else {
        alert("A sessão expirou, a voltar à página inicial.");
        window.location.href = "index.html";
    }
}


var CLIENT_ID = '697021054229-c7jjbfpfmjkrnoqjo2pg7nfj7v1a1f95.apps.googleusercontent.com';

var API_KEY = 'AIzaSyCMSb0abab-1ALwctezS4mWo8AalLXI9KI';

var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

var SCOPES = 'https://www.googleapis.com/auth/drive';

var folderIds = [];

var conflicts = {};

var users;
var definitiveEois ={};
var definitiveTraps ={};
var definiteInfo ={};
var notesJson = '';

fetch("./resources/data1.json").then(function(response) {
    response.text().then(function(body1) {
        fetch("./resources/data2.json").then(function(response) {
            response.text().then(function(body2) {
                var testObject = {};
                testObject["Miguel"] = JSON.parse(body1);
                testObject["Maria"] = JSON.parse(body2);

                //console.log(testObject);
                detectConflict(testObject)
            });
        });
    });
});
// testObject["Miguel"] = JSON.parse("")
// detectConflict()