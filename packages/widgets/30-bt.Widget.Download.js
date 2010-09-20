bt.Widget.Download = (function() {

  var createDefaults = function() {
    return {
      name      : '',
      url       : undefined,
      elem      : undefined,
      buttons   : {
        download  : ['Download %s', 'Loading\u2026'],
        play      : ['Open %s',     'Reopen %s']
      },
      // See documentation for details about working with callbacks.
      callbacks : {
        addTorrent : function() {
          var that = this;
          $(this.elem).progressbar('destroy').empty();
          this.progressBar = bt.progressManager.createBar({
            id   : that.url,
            elem : that.elem
          }, (function() {
            var callback = function() {
              that.callbacks.dispatch('progressBar');
            };
            callback.persona = that;
            return callback;
          })());
        },
        progressBar : function() {
          var that = this;
          $(this.elem).progressbar('destroy').empty();
          var button = $('<button/>').appendTo(this.elem);
          button
            .text(sprintf(this.buttons.play[0], this.name))
            .click(function() {
              $(this).text(sprintf(that.buttons.play[1], that.name));
              _.values(bt.torrent.get(that.url).file.all())[0].open();
              // XXX The following callback should be triggered by above open().
              if ('function' === typeof that.callbacks.openFile) {
                that.callbacks.dispatch('openFile');
              }
            });
        }
      }
    };
  };

  var createError = function(settings) {
    var e = _.clone(settings);
    e.prototype = new Error;
    return e;
  };

  var init = function(settings) {
    var that = this;

    // Check for error conditions.
    if(!(this instanceof bt.Widget.Download)) {
      throw new createError({
        name: 'InvocationError',
        message: 'Widget.Download constructor must create a new instance.'
      });
    }

    // Allow abreviated settings style as URL string instead of an object.
    if ('string' === typeof settings ) settings = { url: settings };

    // Deep-clone defaults and deep-extend user settings into this.settings.
    this.settings = $.extend(true, {}, createDefaults.call(this), settings);

    // Create a default target element node if none has been provided.
    if (!this.settings.elem) {
      this.settings.elem = $('<div/>').appendTo('body')[0];
    }
    $(this.settings.elem).addClass('bt-widget bt-download-widget');
    // The second value in button-text arrays is onclick.
    _.each(this.settings.buttons, function(v, k) {
      if ('string' === typeof that.settings.buttons[k]) {
        that.settings.buttons[k]= [
          that.settings.buttons[k],
          that.settings.buttons[k] ];
      }
    });

    // Give settings.callbacks the methods add and dispatch since they have no
    // access to this. Differentiate callbacks by dlw instance settings name.
    this.settings.callbacks.add = function(category, handler) {
      that.addCallback.call(that, that.settings.name + category, handler);
    }
    this.settings.callbacks.dispatch = function(category) {
      that.dispatchCallbacks.call(that, that.settings.name + category);
    }
    this.settings.callbacks.remove = function(category) {
      that.removeCallbacks.call(that, that.settings.name + category);
    }
    var callbacksAccess = ['add', 'dispatch', 'remove'];

    // Callbacks get default persona of the settings object. You can override
    // this by giving the callback function a persona property.
    _.each(this.settings.callbacks, function(cbFn, cbName) {
      if ('function' === typeof cbFn &&
        -1 === _.indexOf(callbacksAccess, cbName)) {
          cbFn.persona = cbFn.persona || that.settings;
          that.settings.callbacks.add(cbName, cbFn);
        }
    });

    return settings;
  }

  var Result = function(settings) {
    arguments.callee['✓']('bt.Widget.Download', arguments, 'Os');
    settings = init.call(this, settings);
    var that = this, tor = bt.torrent.get(settings.url);

    // Check to see current download state of torrent. Display a button,
    // progress-bar, or play button accordingly.
    if ('undefined' === typeof tor) {
      // A new torrent
      var button = $('<button/>').appendTo(this.settings.elem)
        .text(sprintf(this.settings.buttons.download[0], this.settings.name))
        .click(function() {
          var settings = that.settings;
          button
            .attr('disabled', true)
            .text(sprintf(settings.buttons.download[1], settings.name));
          bt.add.torrent(settings.url, function() {
            that.settings.callbacks.dispatch('addTorrent');
          });
        });
    }
    else {
      if (1000 > tor.properties.get('progress') ) {
        // Download in progress. No need to add, so go to its callback.
        that.settings.callbacks.dispatch('addTorrent');
      }
      else {
        // Download complete. No need for a progress-bar, so go to its callback.
        that.settings.callbacks.dispatch('progressBar');
      }
    }
  };
  Result.prototype = new bt.Widget('Download');
  return Result;
})();
