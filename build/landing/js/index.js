Function.prototype.debounce = function(delay) {
  var fn = this
  return function() {
    fn.args = arguments
    fn.timeout_id && clearTimeout(fn.timeout_id)
    fn.timeout_id = setTimeout(function() { return fn.apply(fn, fn.args) }, delay)
  }
}

function playground() {
  var $elems = $('.js-playground');
  var count = $elems.length;

  $elems.find('[data-toggle="tab"]').on('shown.bs.tab', refreshCodeMirrorInTab);

  function setMode(e) {
    e.preventDefault();

    var $pill = $(this);
    var isDark = ($pill.attr('data-set-mode') === 'dark');

    $(this).closest('ul').find('li').removeClass('active');
    $(this).closest('li').addClass('active');
    $(this).closest('.js-playground').find('.tab-content').toggleClass('theme-dark', isDark);
  }

  function refreshCodeMirrorInTab(e) {
    var $elem = $($(this).attr('href')).find('.CodeMirror');

    if(!$elem.length) {
      return;
    };

    $elem.get(0).CodeMirror.refresh();
  }

  function setCodeMirrors($jade, $html, $mjml) {
    if($jade.length) {
      CodeMirror.fromTextArea($jade.get(0), {
        lineNumbers: true,
        readOnly: true,
        theme: 'auth0',
        mode: 'jade'
      });
    }

    if($html.length) {
      CodeMirror.fromTextArea($html.get(0), {
        lineNumbers: true,
        readOnly: true,
        theme: 'auth0',
        mode: 'text/html'
      });
    }

    if($mjml.length) {
      CodeMirror.fromTextArea($mjml.get(0), {
        lineNumbers: true,
        readOnly: true,
        theme: 'auth0',
        mode: 'text/html'
      });
    }
  }

  $elems.each(function(i) {
    var $component = $(this);

    if(!$component.attr('data-src')) {
      return;
    }

    var path = $component.attr('data-src');

    var $canvas = $component.find('.playground-canvas');
    var $html = $component.find('[data-lang="html"] textarea');
    var $jade = $component.find('[data-lang="jade"] textarea');
    var $mjml = $component.find('[data-lang="mjml"] textarea');

    $component.on('click', '.nav-pills a', setMode);


    function getJade() {
      if(!$jade.length) return;

      return $.get(path + '.jade', function(contents) {
        return $jade.val(contents);
      })
    }

    function getHTML() {
      if(!$html.length) return;

      return $.get(path + '.html', function(contents) {
        return $html.val(contents);
      })
    }

    function getMJML() {
      if(!$mjml.length) return;

      return $.get(path + '.ejs', function(contents) {
        return $mjml.val(contents);
      })
    }

    $.when(
      getJade(),
      getHTML(),
      getMJML()
    ).always(function() {
      if($component.find('[data-styleguide]').length) {
        Styleguide.initElement($component.find('[styleguide]').get(0));
      }
      
      return setCodeMirrors($jade, $html, $mjml)
    });
  });
}


function navigation() {
  $(window).on('hashchange', setSelected);

  function build() {
    var $nav = $('.nav-styleguide ul');

    $nav.html('');

    $('[data-group]').each(function(i) {
      var $group = $(this);
      var name = $group.attr('data-group');
      var id = $group.attr('id');
      var budicon = $group.attr('data-budicon') || 22;

      var tpl = [
        '<li data-accordion class="'+ ((i === 0) ? 'open' : '') +'"><a class="'+ ((i === 0) ? 'is-current' : '') +'" href="#'+ id +'">',
        '<span class="icon icon-budicon-' + budicon + '"></span>',
        name,
        '</a></li>'
      ].join('');

      var $item = $(tpl);

      if($group.find('h2[id]').length) {
        var $list = $('<ul class="nav"></ul>');

        $group.find('h2[id]').each(function(i) {
          var name = $(this).text();
          var id = $(this).attr('id') || 'foo';

          $list.append('<li><a href="#'+ id + '">' + name + '</li>');

          $item.append($list);
        });
      }

      return $nav.append($item);
    });
  }

  function setSelected(hash) {
    var hash = location.hash || hash;
    var activeClass = 'active';
    var $section = $(hash + '[data-group]');
    var $subSection = $(hash).closest('[data-group]');
    var $navItem = $('.nav-styleguide a[href="' + hash + '"]');

    if(!$(hash).length) {
      return;
    }

    if($('[data-group], .nav-styleguide li').length) {
      $('[data-group], .nav-styleguide li').removeClass(activeClass);
    }

    $('#menu').collapse('hide');

    if(hash.length) {
      $('[data-accordion]').removeClass('open');
    }

    if($section.length) {
      $section.addClass(activeClass);
      $(window).scrollTop(0);

      createIframes($section);
    } else if ($subSection.length) {
      createIframes($subSection);

      $subSection.addClass(activeClass);
    }

    $navItem.closest('li').addClass(activeClass);
    $navItem.closest('[data-accordion]').addClass('open');
  }

  build();


  if(location.hash && $(location.hash).length) {
    return setSelected(location.hash);
  }

  setSelected('#' + $('[data-group]').first().attr('id'))

  return splash();
}

function splash() {
  if(!location.hash) {
    $(".lettering-js").lettering();
  }
}

function createIframes($section) {
  function init() {
    $section.find('.js-make-iframe').each(function() {
      var $canvas = $(this);

      var iframe = iframify($canvas.get(0), {
        metaViewport: '<meta name="viewport" content="width=device-width">'
      });

      $(iframe).addClass('tab-pane active iframe-canvas');
      $(iframe).attr('id', $canvas.attr('id'));
    });
  }

  if(!$('body').hasClass('page-loaded')) {
    $(window).on('load', init);
  } else {
    init();
  }



}

function accordions() {
  $('.nav-styleguide [data-accordion]').accordion({
    controlElement: 'a',
    contentElement: 'ul'
  });
}

function snippets() {
  hljs.configure({
    tabReplace: '  ', // 4 spaces
    classPrefix: ''     // don't append class prefix
                        // … other options aren't changed
  });
  hljs.initHighlighting();

  $('pre.hl code').each(function(i, block) {
    hljs.highlightBlock(block);
  });
}

function colors() {
  $('.color [data-hex]').each(function() {
    var color = $(this).closest('.color').css('background-color');

    function toHex(int) {
      var hex = int.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

    function parseColor(color) {
      var arr=[]; color.replace(/[\d+\.]+/g, function(v) { arr.push(parseFloat(v)); });
      return {
        hex: "#" + arr.slice(0, 3).map(toHex).join(""),
        opacity: arr.length == 4 ? arr[3] : 1
      };
    }

    $(this).text(parseColor(color).hex);
  });

  var copyColor = new Clipboard('.js-color', {
    text: function(btn) {
      return $(btn).find('[data-hex]').text();
    }
  });

  copyColor.on('success', function(e) {
    var btn = e.trigger;
    var $label = $('.color-info strong', btn);
    var oValue = $label.text();

    $label.text('Copied to clipboard!');

    setTimeout(function() {
      $label.text(oValue);
    }, 600);
  }.debounce(200));
}

$(function() {
 navigation();
 accordions();
 playground();
 colors();
 snippets();

 $(window).on('load', function(){
   $('body').addClass('page-loaded');
 })
});
