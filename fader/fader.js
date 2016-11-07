module.exports = function(RED) {
    function FaderNode(config) {
        RED.nodes.createNode(this,config);
	this.statusTopic = config.statusTopic;
	this.fadeMinutes = parseInt(config.fadeMinutes);
	this.intervalSeconds = parseInt(config.intervalSeconds);
	this.maxValue = parseInt(config.maxValue);
        this.fadeInterval = -1;
        this.statusValue = -1;
        this.currentValue = -1;
        this.currentTime = 0;
        this.fading = false;

        var node = this;

        updateStatus = function() {
          if (node.fading) {
            node.status({fill:"green",shape:"dot",text:"" + node.statusValue + "/" + node.currentValue})
          } else {
            node.status({fill:"red",shape:"ring",text:"stopped"})
          }
        }

	cancelFading = function() {
	  clearInterval(node.fadeInterval);
	  node.currentValue = 0;
          node.fading = false;
          updateStatus();
	}

	doFading = function(msg, fadeMilliSeconds, intervalMilliseconds) {
	  if (node.statusValue == 0 && node.currentValue > 0) {
            cancelFading();
	    return;
	  }
	  if (node.currentTime <= fadeMilliSeconds) { 
	    node.currentValue = Math.floor((node.currentTime / fadeMilliSeconds)*node.maxValue);
	    if (node.currentValue > node.maxValue) { 
	        node.currentValue = node.maxValue;
	    }
	    var newmsg = {topic: msg.topic, payload: node.currentValue};
	    node.send(newmsg);
            updateStatus();
	    node.currentTime += intervalMilliseconds;
	  } else {
	      return;
	  }
	}

        node.status({fill:"red",shape:"ring",text:"stopped"})

        this.on('input', function(msg) {
          if (msg.topic === node.statusTopic) {
            node.statusValue = msg.payload;
            updateStatus();
          } else {
            if (msg.payload === 'start') {
                if (node.fading) {
                    return;
                }
                node.fading = true;
                node.status({fill:"green",shape:"dot",text:"" + node.statusValue + "/" + node.currentValue})
		var fadeMilliSeconds = node.fadeMinutes * 60 * 1000;
		var intervalMilliseconds = node.intervalSeconds * 1000;
                node.currentTime = 0;
		node.fadeInterval = setInterval(function() { doFading(msg, fadeMilliSeconds, intervalMilliseconds)}, intervalMilliseconds);
            } else if (msg.payload === 'stop') {
                cancelFading();
            }
          }
	});
        node.on('close', function() {
          cancelFading();
        });
    }
    RED.nodes.registerType("fader",FaderNode);
}
