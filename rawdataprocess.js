function openRawForVisit(id) {
    window.open(window.location.origin + '/FitoAgroSite/rawdata.html?visit_id=' + id);
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function getVisitIdFolder(){
    return getUrlVars()['visit_id'];
}

function isUndefined(object){
    return typeof object === "undefined";
}


function generateTableHead(table, data) {
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let key of data) {
        let th = document.createElement("th");
        let text = document.createTextNode(key);
        th.appendChild(text);
        row.appendChild(th);
    }
}


function generateEOITable(table, data) {


    Object.keys(data).sort().forEach(function(protocol) {
        var obsPerProtocol = data[protocol];
        let row = table.insertRow();

        let protocolText = document.createTextNode(protocol);
        let protocolCell = row.insertCell();
        protocolCell.appendChild(protocolText);
        protocolCell.style.textAlign = 'center';

        var obCount = 0;
        Object.keys(obsPerProtocol).forEach(function(ob) {
            var componentsPerObservation = obsPerProtocol[ob];

            if(obCount !== 0) {
                row = table.insertRow();
                row.insertCell();
            }
            let obText = document.createTextNode(ob);
            let obCell = row.insertCell();
            obCell.appendChild(obText);
            obCell.style.textAlign = 'center';

            var descriptionCount = 0;

            Object.keys(componentsPerObservation).forEach(function(description) {
                var arrayOfValues = componentsPerObservation[description];

                if(descriptionCount !== 0) {
                    row = table.insertRow();
                    row.insertCell();
                    row.insertCell();
                }

                let descriptionText;
                if(description !== ob)
                    descriptionText = document.createTextNode(description);
                else
                    descriptionText = document.createTextNode("- - -");
                let descriptionCell = row.insertCell();
                descriptionCell.appendChild(descriptionText);
                descriptionCell.style.textAlign = 'center';

                for(var i = 0; i < arrayOfValues.length; i++){
                    let valueText;

                    if(isUndefined(arrayOfValues[i]))
                        valueText = document.createTextNode("");
                    else
                        valueText = document.createTextNode(arrayOfValues[i]);


                    var cell = row.insertCell();

                    cell.style.textAlign = 'center';

                    cell.appendChild(valueText);
                    if(arrayOfValues[i] !== "0" && arrayOfValues[i] !== "Não" && !isUndefined(arrayOfValues[i]) )
                        cell.style.backgroundColor = "#99FF00";

                }

                descriptionCount++;
            });

            obCount++;
        });
    });
}

function generateTrapTable(table, map){

    var nonZeros = 0;
    let row = table.insertRow();

    Object.keys(map).sort().forEach(function(trapName) {
        var value = map[trapName]['value'];
        let valueText = document.createTextNode(value);
        let cell = row.insertCell();
        cell.style.textAlign = 'center';
        cell.appendChild(valueText);
        if(value !== "0") {
            cell.style.backgroundColor = "#99FF00";
            nonZeros++;
        }
    });
    return nonZeros;
}

function fillNotes(genericNote, specificNotes){
    var note_table = document.getElementById("note_table");

    if(isUndefined(genericNote) && isUndefined(specificNotes)){
        note_table.style.display = 'none';
        document.getElementById('no_notes').style.display = 'block';
        return;
    }


    let row = note_table.insertRow();
    if(!isUndefined(genericNote)){
        let type = document.createTextNode("Genérica");
        let timestamp = document.createTextNode("- - -");
        let valueText = document.createTextNode(genericNote.value);

        let cell = row.insertCell();
        cell.style.textAlign = 'center';
        cell.appendChild(type);
        cell = row.insertCell();
        cell.style.textAlign = 'center';
        cell.appendChild(timestamp);cell = row.insertCell();
        cell.style.textAlign = 'center';
        cell.appendChild(valueText);
    }

    if(!isUndefined(specificNotes)) {
        Object.keys(specificNotes).sort().forEach(function (noteIndex) {
            if(specificNotes[noteIndex].id.includes("_note_")) {
                let row = note_table.insertRow();
                let cell;
                let observation = specificNotes[noteIndex]['observation'];
                observation = getObservationText(observation);
                if (!isUndefined(observation)) {
                    let observationText = document.createTextNode(observation);
                    cell = row.insertCell();
                    cell.style.textAlign = 'center';
                    cell.appendChild(observationText);
                } else {
                    let empty = document.createTextNode("- - -");
                    cell = row.insertCell();
                    cell.style.textAlign = 'center';
                    cell.appendChild(empty);
                }

                let timestamp = specificNotes[noteIndex]['creation_timestamp']; //20210426_092643
                let timestampText = document.createTextNode(timestamp.substr(9, 2) + ":" + timestamp.substr(11, 2));

                cell = row.insertCell();
                cell.style.textAlign = 'center';
                cell.appendChild(timestampText);

                let value = specificNotes[noteIndex]['content'];
                let valueText = document.createTextNode(value);

                cell = row.insertCell();
                cell.appendChild(valueText);
            }
        });
    }

    generateTableHead(note_table, ["Observação","Hora","Nota"]);
}

function getObservationText(observation){
    console.log(observation);
    if(observation != null) {
        let processedObservation = null;
        try {
            let infoJSON = JSON.parse(observation);
            if (!isUndefined(infoJSON["eoi"])) {
                let message = "Árvore " + (parseInt(infoJSON["eoi"]) + 1) + " " + infoJSON["protocol_name"] + ": " + infoJSON["observation_name"];
                if(observation.includes("title"))
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
            console.log(e);

            return undefined;
        }

    }
    return undefined
}
function getProcessedEois(rawJson){
    var maxEoiCount = 0;
    var map = {};
    var flagPerProtocol = {};
    console.log(rawJson);

    var rawDate = rawJson["time_begin"].split('.')[0];
    var defaultObservations = rawJson['info']['Default_observations'];
    var caliber = defaultObservations['Calibre'];
    var genericNote = defaultObservations['Notas'];

    // document.getElementById("date").innerText = rawDate.substring(0,4) + "/" + rawDate.substring(4,6) + "/" + rawDate.substring(6,8);
    // document.getElementById("pob").innerText = rawJson['plot_name'];
    // document.getElementById("crop").innerText = rawJson['crops'];
    // document.getElementById("ef").innerText = defaultObservations['EF'].value;
    // document.getElementById("rain").innerText = defaultObservations['Chuva'].value  === "true" ? "Sim" : "Não";
    // document.getElementById("treatment").innerText = defaultObservations['Tratamento'].value  === "true" ? "Sim" : "Não";
    // document.getElementById("caliber").innerText = typeof  caliber === 'undefined' ? 'Não registado' : caliber.value;
    // //document.getElementById("notes").innerText = typeof  notes === 'undefined' ? 'Não registado' : notes.value;

    fillNotes(genericNote,rawJson['notes']);

    var eoi_table = document.getElementById("eoi_table");

    var eoiJson = rawJson['eois'];
    if(!isUndefined(eoiJson)){
        Object.keys(eoiJson).forEach(function(eoi) {

            var eoiInt = parseInt(eoi);

            var protocolsByEoi = eoiJson[eoiInt];
            if(maxEoiCount < eoiInt)
                maxEoiCount = eoiInt;
            Object.keys(protocolsByEoi).forEach(function(protocol) {
                var obsPerProtocol = protocolsByEoi[protocol];

                if(typeof flagPerProtocol[protocol] === "undefined") {
                    flagPerProtocol[protocol] = false;
                }

                Object.keys(obsPerProtocol).forEach(function(obs) {
                    var componentPerObservation = obsPerProtocol[obs];
                    Object.keys(componentPerObservation).forEach(function(component) {
                        var componentData = componentPerObservation[component];

                        var description = componentData['description'];
                        var rawValue = componentData['value'];

                        if(rawValue === "true") rawValue = "1";
                        else if(rawValue === "false") rawValue = "0";

                        if(rawValue !== "0" && flagPerProtocol[protocol] === false) {
                            flagPerProtocol[protocol] = true;
                        }


                        if(isUndefined(map[protocol]))
                            map[protocol] = {};
                        if(isUndefined(map[protocol][obs]))
                            map[protocol][obs] = {};
                        if(isUndefined(map[protocol][obs][description]))
                            map[protocol][obs][description] = [];

                        map[protocol][obs][description][eoiInt] = rawValue;


                    });

                });

            });

        });
        Object.keys(flagPerProtocol).forEach(function(protocol) {
            if(flagPerProtocol[protocol] === false)
                delete map[protocol];
        });

        if(Object.keys(map).length !== 0){
            const arr = Array.from({length: maxEoiCount + 1}, (_, index) => index + 1);
            let data = ["Protocolo", "Observação","Árvore nº."];
            for(var i = 0; i < arr.length; i++){
                data.push(arr[i].toString());
            }
            generateEOITable(eoi_table, map);
            generateTableHead(eoi_table, data);
        }else {
            eoi_table.style.display = 'none';
            document.getElementById('no_data_eoi').style.display = 'block';
        }
    }else{
        eoi_table.style.display = 'none';
        document.getElementById('no_data_eoi').style.display = 'block';
    }

    var trap_table = document.getElementById("trap_table");

    var trapJson = rawJson['traps'];
    if(!isUndefined(trapJson)) {
        let trapKeys = Object.keys(trapJson).sort();
        let nonZeros = generateTrapTable(trap_table, trapJson);
        generateTableHead(trap_table, trapKeys);
        if (nonZeros === 0) {
            trap_table.style.display = 'none';
            document.getElementById('no_data_trap').style.display = 'block';
        }
    }else{
        trap_table.style.display = 'none';
        document.getElementById('no_data_trap').style.display = 'block';
    }
}

function getProcessedLab(lab){
    document.getElementById('lab_div').style.display = 'block';
    var aux = JSON.parse(lab);
    var eoiJson = aux['eois'];
    var maxEoiCount = 0;
    var map = {};

    console.log(aux['info']);

    try {
        var nea = aux['info']['nea'];
        if(!isUndefined(nea)){
            document.getElementById('nea').innerText = nea + "%";
            document.getElementById('nea_div').style.display = 'block';
        }
    } catch (error) {
        console.error(error);
    }

    try {
        var date_filo = aux['info']['Observations_per_portocol']['Filoxera (Fase 4)'][0].value;
        if(!isUndefined(date_filo)){
            var splitDate = date_filo.split('/');
            var processedDate = splitDate[2] + '/' + splitDate[1] + '/' + splitDate[0];
            document.getElementById('date_filo').innerText = processedDate ;
            document.getElementById('date_filo_div').style.display = 'block';
        }
    } catch (error) {
        console.error(error);
    }

    Object.keys(eoiJson).forEach(function(eoi) {

        var eoiInt = parseInt(eoi);

        var protocolsByEoi = eoiJson[eoiInt];
        if(maxEoiCount < eoiInt)
            maxEoiCount = eoiInt;
        Object.keys(protocolsByEoi).forEach(function(protocol) {
            var obsPerProtocol = protocolsByEoi[protocol];
            protocol = protocol.replace("Filoxera (","");
            protocol = protocol.substr(0, protocol.length -1);
            Object.keys(obsPerProtocol).forEach(function(obs) {
                var componentPerObservation = obsPerProtocol[obs];
                Object.keys(componentPerObservation).forEach(function(component) {
                    var componentData = componentPerObservation[component];

                    var description = componentData['description'];
                    var rawValue = componentData['value'];

                    if(rawValue === "true") rawValue = "Sim";
                    else if(rawValue === "false") rawValue = "Não";

                    if(isUndefined(map[protocol]))
                        map[protocol] = {};
                    if(isUndefined(map[protocol][obs]))
                        map[protocol][obs] = {};
                    if(isUndefined(map[protocol][obs][description]))
                        map[protocol][obs][description] = [];

                    map[protocol][obs][description][eoiInt] = rawValue;


                });

            });

        });

    });

    var lab_table = document.getElementById("lab_table");

    const arr = Array.from({length: maxEoiCount + 1}, (_, index) => index + 1);
    let data = ["Fase", "Observação","Árvore nº."];
    for(var i = 0; i < arr.length; i++){
        data.push(arr[i].toString());
    }
    generateEOITable(lab_table, map);
    generateTableHead(lab_table, data);
    console.log(data);
}

let visit_json;
let lab_json;

let auxJson = sessionStorage.getItem("visit_json");

if(auxJson != null)
    visit_json = JSON.parse(auxJson);

auxJson = sessionStorage.getItem("lab_json");

if(auxJson != null)
    lab_json = JSON.parse(auxJson);

getProcessedEois(visit_json);

if(lab_json != null)
    getProcessedLab(lab_json);

