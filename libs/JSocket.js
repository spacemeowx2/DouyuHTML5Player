/*
 * Jsocket - Socket on Javascript
 * Author: Masahiro Chiba <nihen@megabbs.com>
 * Depends:
 *  - jQuery: http://jquery.com/
 *  - jQuery TOOLS - Flashembed: http://flowplayer.org/tools/flashembed.html
 * SYNOPSIS:
 *  JSocket.init('/static/JSocket.swf', function () {
 *     socket = new JSocket({
 *         connectHandler: connectHandler,
 *         dataHandler:    dataHandler,
 *         closeHandler:   closeHandler,
 *         errorHandler:   errorHandler
 *     });
 *     socket.connect(location.hostname, location.port || 80);
 *  });
 *  function connectHandler() {
 *      socket.writeFlush("GET / HTTP/1.0\x0D\x0A");
 *      socket.write("Host: " + location.hostname + "\x0D\x0A\x0D\x0A");
 *      socket.flush();
 *  }
 *  function dataHandler(data) {
 *      alert(data);
 *      socket.close();
 *  }
 *  function closeHandler() {
 *      alert('lost connection')
 *  }
 *  function errorHandler(errorstr) {
 *      alert(errorstr);
 *  }
 *  
 * */
function JSocket() {
    this.initialize.apply(this, arguments);
}
JSocket.VERSION = '0.05';
JSocket.init = function(src, swfloadedcb) {
    var flash = ['<object type="application/x-shockwave-flash" ', 'id="jsocket" ', 'name="jsocket" ', 'align="middle" ', 'allowscriptaccess="always" ', 'allowfullscreen="true" ', 'allowfullscreeninteractive="true" ', 'wmode="transparent" ', 'data="'+src+'" ', 'width="100%" ', 'height="100%">', '<param name="src" value="'+src+'">', '<param name="quality" value="high">', '<param name="bgcolor" value="#fff">', '<param name="allowscriptaccess" value="always">', '<param name="allowfullscreen" value="true">', '<param name="wmode" value="transparent">', '<param name="allowFullScreenInteractive" value="true">', '<param name="flashvars" value="">', "</object>"].join("")
    var div = document.createElement('div')
    div.style.width = '1px'
    div.style.height = '1px'
    document.body.appendChild(div)
    div.innerHTML = flash
    var api = document.querySelector('#jsocket')
    console.log(div, api)
    JSocket.flashapi = api;

    if ( JSocket.flashapi.newsocket ) {
        // for IE(because already construct)
        swfloadedcb();
    }
    else {
        JSocket.swfloadedcb = swfloadedcb;
    }
};
JSocket.swfloaded = function() {
    if ( JSocket.swfloadedcb ) {
        JSocket.swfloadedcb();
    }
};
JSocket.handlers = new Array();
JSocket.defaultHandlers = {
    connectHandler: function () {},
    dataHandler: function () {},
    closeHandler: function () {},
    errorHandler: function () {}
};
JSocket.connectHandler = function(socid) {
    JSocket.handlers[socid].connectHandler();
};
JSocket.dataHandler = function(socid, data) {
    try {
        JSocket.handlers[socid].dataHandler(atob(data));
    } catch (e) {
        console.error(e)
    }
};
JSocket.closeHandler = function(socid) {
    JSocket.handlers[socid].closeHandler();
};
JSocket.errorHandler = function(socid, str) {
    JSocket.handlers[socid].errorHandler(str);
};
JSocket.prototype = {
    initialize: function(handlers, newsocketopt) {
        this.socid    = JSocket.flashapi.newsocket(newsocketopt);
        JSocket.handlers[this.socid] = handlers;
    },
    connect: function(host, port) {
        JSocket.flashapi.connect(this.socid, host, port);
    },
    write: function(data) {
       JSocket.flashapi.write(this.socid, btoa(data));
    },
    writeFlush: function(data) {
       JSocket.flashapi.writeFlush(this.socid, btoa(data));
    },
    close: function() {
        JSocket.flashapi.close(this.socid);
    },
    flush: function() {
        JSocket.flashapi.flush(this.socid);
    }
};