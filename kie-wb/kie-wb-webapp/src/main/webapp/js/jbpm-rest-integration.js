function jbpmRestAPI() {

    var configs = new Object();
    var lastConfig;

    var listener = function dolisten(event){

        if (lastConfig) {
            if (!lastConfig.host.startsWith(event.origin)) return;

            if (event.data == 'success' && lastConfig.onsuccess) lastConfig.onsuccess(event.data);
            else if (lastConfig.onerror) lastConfig.onerror(event.data);
            delete configs[lastConfig.containerId];
        }
    }

    var getXMLDoc = function(xml) {
        if (!xml) return;

        alert("the result xml: " + xml);

        var xmlDoc;
        if (window.DOMParser) {
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(xml, "text/xml");
        } else { // Internet Explorer
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = false;
            xmlDoc.loadXML(xml);
        }
        return xmlDoc;
    }

    if (window.addEventListener){
        addEventListener("message", listener, false)
    } else {
        attachEvent("onmessage", listener)
    }

    var getRequest = function(config) {
        sendRequest(config, "GET");
    }

    var postRequest = function(config) {
        sendRequest(config, "POST");
    }

    var sendRequest = function(config, method) {
        if (!config) return;

        var ajaxHandler = new Object();

        if (window.XMLHttpRequest) {
            ajaxHandler.ajaxReq = new XMLHttpRequest();
        }
        else if (window.ActiveXObject) {
            ajaxHandler.ajaxReq = new ActiveXObject('Microsoft.XMLHTTP');
        }

        ajaxHandler.ajaxResponse = function() {
            // Only if req shows "complete"
            var readyState, status;
            try{
                readyState = ajaxHandler.ajaxReq.readyState;
                if (readyState == 4) {
                    status = ajaxHandler.ajaxReq.status;
                }
            }
            catch(e){
                alert("error: " + e)
            }
            if (readyState == 4) {
                if (status == 200) {
                    if (config.onsuccess) config.onsuccess(ajaxHandler.ajaxReq.responseText);
                } else {
                    if (config.onerror) config.onerror(ajaxHandler.ajaxReq.responseText);
                }
            }

        }
        ajaxHandler.ajaxReq.onreadystatechange = ajaxHandler.ajaxResponse;
        ajaxHandler.ajaxReq.open(method, config.url, true);
        ajaxHandler.ajaxReq.send();
    }


    this.setContentValues = function(containerId, message) {
        try {
            var frame = document.getElementById(containerId + '_restFrame');
            if (frame) {
                var frameDoc = frame.contentWindow.document;
                frameDoc.getElementById('container').value = containerId;
                frameDoc.getElementById('message').value = message;
            }
        } catch (err) {
            alert(err);
        }

    }

    this.startTaskForm = function(containerId, message) {
        document.getElementById(containerId).innerHTML = '<iframe id="' + containerId + '_restFrame" src="content.html"/>';
        var config = {
            msg: message,
            action: 'complete',
            onsuccess: null,
            onerror: null
        };
        configs[containerId] = config;
        setTimeout("jbpmRestAPI.setContentValues('" + containerId + "', '" + message + "')", 100);
    }

    this.completeTaskForm = function(containerId, onsuccess, onerror) {
        if (onsuccess != null) configs[containerId].onsuccess = onsuccess;
        if (onerror != null) configs[containerId].onerror = onerror;
        document.getElementById(containerId + '_restFrame').contentWindow.submitForm();;
    }

    this.showStartProcessForm = function(hostUrl, deploymentId, processId, responseDiv) {
        var config = {
            containerId: responseDiv,
            host: hostUrl,
            url: hostUrl + "rest/runtime/" + deploymentId + "/process/" + processId + "/startform",
            status: null,
            deploymentId: deploymentId,
            processId: processId,
            formURL: null,
            onsuccess: function (responseText) {
                var xmlDoc = getXMLDoc(responseText);
                this.status = xmlDoc.getElementsByTagName("status")[0].childNodes[0].nodeValue;
                this.formURL = xmlDoc.getElementsByTagName("formUrl")[0].childNodes[0].nodeValue;
                var html = "<iframe id='" + this.containerId + "_form' src='" + this.formURL + "' frameborder='0' style='width:100%; height:100%'></iframe>";
                var targetDiv = document.getElementById(this.containerId);
                targetDiv.innerHTML = html;
            },
            onerror: null
        };
        configs[responseDiv] = config;

        postRequest(config);
    };


    this.startProcess = function(responseDiv, onsuccess, onerror) {
        postAction(responseDiv, 'startProcess', onsuccess, onerror);
    };

    this.claimTask = function(responseDiv, onsuccess, onerror) {
        postAction(responseDiv, 'claimTask', onsuccess, onerror);
    };

    this.startTask = function(responseDiv, onsuccess, onerror) {
        postAction(responseDiv, 'startTask', onsuccess, onerror);
    };

    this.releaseTask = function(responseDiv, onsuccess, onerror) {
        postAction(responseDiv, 'releaseTask', onsuccess, onerror);
    };

    this.saveTask = function(responseDiv, onsuccess, onerror) {
        postAction(responseDiv, 'saveTask', onsuccess, onerror);
    };

    this.completeTask = function(responseDiv, onsuccess, onerror) {
        postAction(responseDiv, 'completeTask', onsuccess, onerror);
    };

    var postAction = function(responseDiv, action, onsuccess, onerror) {
        if (responseDiv && action) {
            var config = configs[responseDiv];
            if (config) {
                var frame = document.getElementById(responseDiv + '_form').contentWindow;
                frame.postMessage(action, config.formURL);
                lastConfig = config;
                if (onsuccess) lastConfig.onsuccess = onsuccess;
                if (onerror) lastConfig.onerror = onerror;
            }
        }
    }

    this.showTaskForm = function (hostUrl, taskId, responseDiv) {
        var config = {
            containerId: responseDiv,
            host: hostUrl,
            url: hostUrl + "rest/task/" + taskId + "/showTaskForm",
            status: null,
            formURL: null,
            onsuccess: function (responseText) {
                var xmlDoc = getXMLDoc(responseText);
                this.status = xmlDoc.getElementsByTagName("status")[0].childNodes[0].nodeValue;
                this.formURL = xmlDoc.getElementsByTagName("formUrl")[0].childNodes[0].nodeValue;
                var html = "<iframe id='" + this.containerId + "_form' src='" + this.formURL + "' frameborder='0' style='width:100%; height:100%'></iframe>";
                var targetDiv = document.getElementById(this.containerId);
                targetDiv.innerHTML = html;
            },
            onerror: null
        };
        configs[responseDiv] = config;

        getRequest(config);
    }


    this.notifyError =  function (containerId) {
        var onerror = configs[containerId].onerror;
        if (onerror != null) onerror();
    };

    this.notifyOK =  function (containerId) {
        var onsuccess = configs[containerId].onsuccess;
        if (onsuccess != null) onsuccess();
        document.getElementById(containerId).innerHTML = '';
        delete configs[containerId];
    };
};


var jbpmRestAPI = new jbpmRestAPI();