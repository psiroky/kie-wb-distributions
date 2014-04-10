function jbpmRestAPI() {

    var configs = new Object();

    var listener = function dolisten(event){

        var i=0;

        var config = null;

        for (var key in configs) {
            var formConfig = configs[key];
            if (formConfig && formConfig.host.startsWith(event.origin)) {
                config = formConfig;
                break;
            }
        }

        if (config) processFormAction(config);
    }

    var processFormAction = function(config) {
        if (!config) return;

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


    this.startProcess = function(responseDiv) {
        postAction(responseDiv, 'startProcess');
    };

    this.claimTask = function(responseDiv) {
        postAction(responseDiv, 'claimTask');
    };

    this.startTask = function(responseDiv) {
        postAction(responseDiv, 'startTask');
    };

    this.releaseTask = function(responseDiv) {
        postAction(responseDiv, 'releaseTask');
    };

    this.saveTask = function(responseDiv) {
        postAction(responseDiv, 'saveTask');
    };

    this.completeTask = function(responseDiv) {
        postAction(responseDiv, 'completeTask');
    };

    var postAction = function(responseDiv, action) {
        if (responseDiv && action) {
            var config = configs[responseDiv];
            if (config) {
                var frame = document.getElementById(responseDiv + '_form').contentWindow;
                frame.postMessage('startProcess', config.formURL);
            }
        }
    }

    /**
     * public static final String ACTION_CLAIM_TASK = "claimTask";
     public static final String ACTION_START_TASK = "startTask";
     public static final String ACTION_RELEASE_TASK = "releaseTask";
     public static final String ACTION_SAVE_TASK = "saveTask";
     public static final String ACTION_COMPLETE_TASK = "completeTask";
     * @param containerId
     */


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