const GelatoPage = require('gelato/page');
const Vocabs = require('collections/VocabCollection');
const Prompt = require('components/study/prompt/StudyPromptComponent.js');
const DemoCallToActionDialog = require('dialogs1/demo-call-to-action/view');
const DemoLanguageSelectDialog = require('dialogs1/demo-language-select/view');
const ItemsCollection = require('collections/ItemCollection');
const vent = require('vent');

/**
 * @class Demo
 * @extends {GelatoPage}
 */
const DemoPage = GelatoPage.extend({

  /**
   * @property events
   * @type Object
   */
  events: {
    'click #contact-submit': 'handleClickContactSubmit'
  },

  /**
   * @property showFooter
   * @type Boolean
   */
  showFooter: false,

  /**
   * @property title
   * @type {String}
   */
  title: 'Demo - Skritter',

  /**
   * @property template
   * @type {Function}
   */
  template: require('./Demo'),

  /**
   * @method initialize
   * @param {Object} [options]
   * @constructor
   */
  initialize: function(options) {
    _.bindAll(this, 'teachDemoChar1','teachDemoChar2', 'writeDemoChar1',
      'writeDemoChar2', 'completeDemo', 'switchToWriting', 'teachEraseDemoChar1',
      'teachDefinitionPrompt1', 'teachEraseDemoChar2');

    this.dialog = null;
    this.lang = 'zh';
    this.notify = null;
    this.prompt = new Prompt({
      page: this,
      isDemo: true
    });
    this.promptItems = null;
    this.vocab = null;
    this.vocabs = new Vocabs();
    this.items = new ItemsCollection();
  },

  /**
   * @method render
   * @returns {DemoPage}
   */
  render: function() {
    this.renderTemplate();
    this.prompt.setElement('#demo-prompt-container').render();
    this.loadDemo();

    return this;
  },

  /**
   * @method loadDemo
   */
  loadDemo: function() {
    const self = this;

    async.waterfall(
      [
        function(callback) {
          self.dialog = new DemoLanguageSelectDialog();
          self.dialog.open();
          self.dialog.once('select', callback);
        },
        function(lang, callback) {
          ScreenLoader.show();
          ScreenLoader.post('Loading demo word');
          app.mixpanel.track('Started demo', {'Language': lang});
          self.lang = lang;
          const vocabDataZh = {"Vocabs":[{"lang":"zh","priority":0,"style":"both","audio":"http://storage.googleapis.com/skritter_audio/zh/cpod/6364231618265088.mp3","toughness":1,"sentenceIds":[],"dictionaryLinks":{"you-dao":"http://dict.youdao.com/search?q=%E4%BD%A0%E5%A5%BD&keyfrom=dict.index","mdbg":"http://www.mdbg.net/chindict/chindict.php?page=worddict&wdrst=0&wdqb=%E4%BD%A0%E5%A5%BD","yellow-bridge":"http://www.yellowbridge.com/chinese/dictionary.php?word=%E4%BD%A0%E5%A5%BD","chinesepod":"http://chinesepod.com/tools/glossary/entry/%E4%BD%A0%E5%A5%BD","zdic":"","hanzicraft":"http://www.hanzicraft.com/character/%E4%BD%A0%E5%A5%BD","tatoeba-zh":"http://tatoeba.org/eng/sentences/search?query=%E4%BD%A0%E5%A5%BD&from=cmn&to=und","tw-moe":"https://www.moedict.tw/%E4%BD%A0%E5%A5%BD"},"bannedParts":[],"ilk":"word","writing":"\u4f60\u597d","audios":[{"source":"cpod","reading":"ni3hao3","mp3":"http://storage.googleapis.com/skritter_audio/zh/cpod/6364231618265088.mp3","writing":null,"id":"6364231618265088"}],"containedVocabIds":["zh-\u4f60-0","zh-\u597d-0"],"audioURL":"http://storage.googleapis.com/skritter_audio/zh/cpod/6364231618265088.mp3","toughnessString":"easiest","definitions":{"en":"hello; how do you do"},"starred":false,"reading":"ni3hao3","id":"zh-\u4f60\u597d-0","sentenceId":"zh-\u665a\u4e0a\u597d\u4f60\u597d\u5417-0"}],"statusCode":200,"Decomps":[],"Sentences":[{"lang":"zh","sentenceIds":[],"style":"simp","toughness":9,"creator":"Tatoeba","segmentation":{"readingFillers":[""," ",", "," ","?"],"reading":"Wan3shang5 hao3, ni3hao3 ma5?","wordWritings":["\u665a\u4e0a","\u597d","\u4f60\u597d","\u5417"],"writing":"\u665a\u4e0a\u597d\uff0c\u4f60\u597d\u5417\uff1f","wordVocabVotes":[3,5,5,42,0,0],"wordReadings":["wan3shang5","hao3","ni3hao3","ma5"],"wordVocabIds":["zh-\u665a\u4e0a-0","zh-\u597d-0","zh-\u4f60\u597d-0","zh-\u5417-0"],"overallVotes":55,"writingFillers":["","","\uff0c","","\uff1f"]},"bannedParts":[],"ilk":"sent","writing":"\u665a\u4e0a\u597d\uff0c\u4f60\u597d\u5417\uff1f","dictionaryLinks":{"you-dao":"http://dict.youdao.com/search?q=%E6%99%9A%E4%B8%8A%E5%A5%BD%E4%BD%A0%E5%A5%BD%E5%90%97&keyfrom=dict.index","mdbg":"http://www.mdbg.net/chindict/chindict.php?page=worddict&wdrst=0&wdqb=%E6%99%9A%E4%B8%8A%E5%A5%BD%E4%BD%A0%E5%A5%BD%E5%90%97","yellow-bridge":"http://www.yellowbridge.com/chinese/dictionary.php?word=%E6%99%9A%E4%B8%8A%E5%A5%BD%E4%BD%A0%E5%A5%BD%E5%90%97","chinesepod":"http://chinesepod.com/tools/glossary/entry/%E6%99%9A%E4%B8%8A%E5%A5%BD%E4%BD%A0%E5%A5%BD%E5%90%97","zdic":"","hanzicraft":"http://www.hanzicraft.com/character/%E6%99%9A%E4%B8%8A%E5%A5%BD%E4%BD%A0%E5%A5%BD%E5%90%97","tatoeba-zh":"http://tatoeba.org/eng/sentences/search?query=%E6%99%9A%E4%B8%8A%E5%A5%BD%E4%BD%A0%E5%A5%BD%E5%90%97&from=cmn&to=und","tw-moe":"https://www.moedict.tw/%E6%99%9A%E4%B8%8A%E5%A5%BD%E4%BD%A0%E5%A5%BD%E5%90%97"},"containedVocabIds":["zh-\u665a-0","zh-\u4e0a-0","zh-\u597d-0","zh-\u4f60-0","zh-\u597d-0","zh-\u5417-0"],"toughnessString":"hardest","definitions":{"en":"Good evening, how are you?"},"starred":false,"reading":"Wan3shang5 hao3, ni3hao3 ma5?","id":"zh-\u665a\u4e0a\u597d\u4f60\u597d\u5417-0"}]};
          const vocabDataJa = {"Vocabs":[{"lang":"ja","rareKanji":false,"sentenceId":"ja-\u3061\u3087\u3063\u3068\u5143\u6c17\u304c\u306a\u3044\u3067\u3059-0","audio":"http://storage.googleapis.com/skritter_audio/ja/kaori/6311145470164992.mp3","toughness":4,"sentenceIds":[],"dictionaryLinks":{"wwwjdic":"http://nihongo.monash.edu/cgi-bin/wwwjdic?1MMJ%E5%85%83%E6%B0%97","jisho":"http://jisho.org/words?jap=%E5%85%83%E6%B0%97","goo":"http://dictionary.goo.ne.jp/srch/je/%E5%85%83%E6%B0%97/m0u/","weblio":"http://ejje.weblio.jp/content/%E5%85%83%E6%B0%97","alc":"http://eow.alc.co.jp/%E5%85%83%E6%B0%97/UTF-8/"},"bannedParts":[],"ilk":"word","writing":"\u5143\u6c17","audios":[{"source":"kaori","reading":"\u3052\u3093\u304d","mp3":"http://storage.googleapis.com/skritter_audio/ja/kaori/6311145470164992.mp3","writing":"\u5143\u6c17","id":"6311145470164992"}],"containedVocabIds":["ja-\u5143-0","ja-\u6c17-0"],"audioURL":"http://storage.googleapis.com/skritter_audio/ja/kaori/6311145470164992.mp3","toughnessString":"medium","definitions":{"en":"healthy; energetic"},"starred":false,"reading":"\u3052\u3093\u304d","id":"ja-\u5143\u6c17-0"}],"statusCode":200,"Decomps":[],"Sentences":[{"lang":"ja","rareKanji":false,"segmentation":{"readingFillers":["","","","","",""],"reading":"\u3061\u3087\u3063\u3068\u3052\u3093\u304d\u304c\u306a\u3044\u3067\u3059\u3002","wordWritings":["\u3061\u3087\u3063\u3068","\u5143\u6c17","\u304c\u306a\u3044","\u3067\u3059","\u3002"],"writing":"\u3061\u3087\u3063\u3068\u5143\u6c17\u304c\u306a\u3044\u3067\u3059\u3002","wordVocabVotes":[0,0,0,0,0],"wordReadings":["\u3061\u3087\u3063\u3068","\u3052\u3093\u304d","\u304c\u306a\u3044","\u3067\u3059","\u3002"],"wordVocabIds":["ja-\u3061\u3087\u3063\u3068-0","ja-\u5143\u6c17-0","","ja-\u3067\u3059-0",""],"overallVotes":5,"writingFillers":["","","","","",""]},"toughness":47,"creator":"g1itch","dictionaryLinks":{"wwwjdic":"http://nihongo.monash.edu/cgi-bin/wwwjdic?1MMJ%E3%81%A1%E3%82%87%E3%81%A3%E3%81%A8%E5%85%83%E6%B0%97%E3%81%8C%E3%81%AA%E3%81%84%E3%81%A7%E3%81%99","jisho":"http://jisho.org/words?jap=%E3%81%A1%E3%82%87%E3%81%A3%E3%81%A8%E5%85%83%E6%B0%97%E3%81%8C%E3%81%AA%E3%81%84%E3%81%A7%E3%81%99","goo":"http://dictionary.goo.ne.jp/srch/je/%E3%81%A1%E3%82%87%E3%81%A3%E3%81%A8%E5%85%83%E6%B0%97%E3%81%8C%E3%81%AA%E3%81%84%E3%81%A7%E3%81%99/m0u/","weblio":"http://ejje.weblio.jp/content/%E3%81%A1%E3%82%87%E3%81%A3%E3%81%A8%E5%85%83%E6%B0%97%E3%81%8C%E3%81%AA%E3%81%84%E3%81%A7%E3%81%99","alc":"http://eow.alc.co.jp/%E3%81%A1%E3%82%87%E3%81%A3%E3%81%A8%E5%85%83%E6%B0%97%E3%81%8C%E3%81%AA%E3%81%84%E3%81%A7%E3%81%99/UTF-8/"},"bannedParts":[],"created":1374776549,"ilk":"sent","writing":"\u3061\u3087\u3063\u3068\u5143\u6c17\u304c\u306a\u3044\u3067\u3059\u3002","containedVocabIds":["ja-\u5143-0","ja-\u6c17-0"],"sentenceIds":[],"toughnessString":"unknown","definitions":{"en":"I feel a bit down."},"starred":false,"reading":"\u3061\u3087\u3063\u3068\u3052\u3093\u304d\u304c\u306a\u3044\u3067\u3059\u3002","id":"ja-\u3061\u3087\u3063\u3068\u5143\u6c17\u304c\u306a\u3044\u3067\u3059-0"}]};
          self.vocabs.add(lang === 'zh' ? vocabDataZh.Vocabs : vocabDataJa.Vocabs);
          app.set('demoLang', lang);
          self.vocab = self.vocabs.at(0);
          callback(null, self.vocab);
        },
        function(vocab, callback) {
          if (vocab.has('containedVocabIds')) {
            self.vocabs.fetch({
              data: {
                include_decomps: true,
                include_sentences: true,
                ids: vocab.get('containedVocabIds').join('|')
              },
              remove: false,
              error: function(error) {
                callback(error);
              },
              success: function() {
                callback(null, vocab);
              }
            });
          } else {
            callback(null, vocab);
          }
        },
        function(vocab, callback) {
          app.user.characters.fetch({
              data: {
                languageCode: vocab.get('lang'),
                writings: vocab.get('writing')
              },
              remove: false,
              error: function(error) {
                callback(error);
              },
              success: function() {
                callback(null, vocab);
              }
            }
          );
        }
      ],
      function(error, vocab) {
        ScreenLoader.hide();
        self.prompt.show();
        if (app.isDevelopment()) {
          const runeItems = vocab.getPromptItems('rune');
          self.promptItems = runeItems;
        } else {
          self.promptItems = vocab.getPromptItems('rune');
        }
        self.promptItems.teachAll();
        self.teachDemoChar1();
      }
    );
  },

  /**
   * Step that teaches users how to use the erase characters from the prompt
   */
  teachEraseDemoChar1: function() {
    vent.trigger('notification:show', {
        dialogTitle: 'Erasing Characters',
        showTitle: true,
        keepAlive: true,
        body: this.parseTemplate(require('./notify-erase-character1.jade'))
      });

    const eraseBtn = $('.icon-study-erase');
    const eraseBtnPos = eraseBtn.offset();
    const eraseBtnWidth = Math.round(eraseBtn.width() / 2);
    const eraseBtnHeight = Math.round(eraseBtn.width() / 2);
    vent.trigger('callToActionGuide:toggle', true, {
      top: (eraseBtnPos.top - eraseBtnHeight) + 'px',
      left: (eraseBtnPos.left - eraseBtnWidth) + 'px',
      width: (eraseBtnHeight * 4) + 'px',
      height: (eraseBtnHeight * 4) + 'px'
    });

    this.prompt.once('character:erased', this.teachEraseDemoChar2);
  },

  /**
   * Step that responds to a user erasing a character
   */
  teachEraseDemoChar2: function() {
    vent.trigger('notification:show', {
      dialogTitle: 'Erasing Characters',
      showTitle: true,
      keepAlive: true,
      body: this.parseTemplate(require('./notify-erase-character2.jade'))
    });

    vent.trigger('callToActionGuide:toggle', false);

    this.prompt.once('character:complete', this.teachDefinitionPrompt1);
  },

  /**
   * Step that teaches users how to answer a definition prompt
   */
  teachDefinitionPrompt1: function() {
    const defnItems = this.vocab.getPromptItems('defn');
    this.promptItems = defnItems;
    this.prompt.set(this.promptItems);

    vent.trigger('notification:show', {
      dialogTitle: 'Definition Prompts',
      showTitle: true,
      keepAlive: true,
      body: this.parseTemplate(require('./notify-definition1.jade'))
    });
  },

  /**
   * @method step1
   */
  teachDemoChar1: function() {
    this.prompt.tutorial.show();
    this.prompt.tutorial.setMessage(this.parseTemplate(require('./notify-step1')));
    this.prompt.set(this.promptItems);
    this.prompt.shortcuts.unregisterAll();
    this.prompt.$('#navigation-container').hide();
    this.prompt.$('#toolbar-action-container').hide();
    this.prompt.$('#toolbar-vocab-container').hide();
    this.prompt.once('character:complete', this.teachDemoChar2);

    if (app.isDevelopment()) {
      this.showDemoGuidePopup();
    }
  },

  /**
   * @method step3
   */
  teachDemoChar2: function() {
    app.mixpanel.track('Completed tracing demo character #1');

    this.prompt.tutorial.setMessage(this.parseTemplate(require('./notify-step3')));
    this.prompt.$('#toolbar-action-container').hide();
    this.prompt.once('character:complete', this.writeDemoChar1);
  },

  /**
   * Erases the characters and goes back to the beginning of the review
   */
  switchToWriting: function() {
    this.prompt.part.eraseCharacter();
    this.prompt.previous();
    this.prompt.part.eraseCharacter();
    if (app.isDevelopment()) {
      vent.trigger('notification:show', {
        dialogTitle: 'Getting Hints',
        showTitle: true,
        keepAlive: true,
        body: this.parseTemplate(require('./notify-step2'))
      });
    }
  },

  /**
   * @method step2
   */
  writeDemoChar1: function() {
    this.switchToWriting();
    app.mixpanel.track('Completed tracing demo character #2');
    this.prompt.tutorial.setMessage(this.parseTemplate(require('./notify-step2')));
    this.prompt.review.set('score', 3);
    this.prompt.$('#toolbar-action-container').show();
    this.prompt.$('#toolbar-grading-container').hide();
    this.prompt.once('reviews:next', this.writeDemoChar2);
  },

  /**
   * @method step4
   */
  writeDemoChar2: function() {
    app.mixpanel.track('Completed writing demo character #1');
    this.prompt.tutorial.setMessage(this.parseTemplate(require('./notify-step4')));
    this.prompt.part.eraseCharacter();
    this.prompt.review.set('score', 3);
    this.prompt.$('#toolbar-action-container').show();

    if (app.isDevelopment()) {
      this.prompt.once('character:complete', this.teachEraseDemoChar1);
    } else {
      this.prompt.once('character:complete', this.completeDemo);
    }
  },

  /**
   * @method step5
   */
  completeDemo: function() {
    app.mixpanel.track('Completed writing demo character #2');
    this.dialog = new DemoCallToActionDialog();
    this.dialog.open();
  },

  /**
   * Shows a popup that guides the user through the demo and
   * updates as the user progresses through it.
   */
  showDemoGuidePopup: function() {
    vent.trigger('notification:show', {
      dialogTitle: 'First Characters',
      showTitle: true,
      body: "Let's get started by learning the characters in the word <b>Chinese language</b>",
      buttonText: 'Next',
      showConfirmButton: true,
      style: {
        backdrop: {
          top: '51px'
        },
        dialog: {
          top: '15%'
        }
      },
      next: {
        dialogTitle: 'First Characters',
        showTitle: true,
        body: "We’ll always teach you the correct stroke order for new characters you’re learning. Trace the strokes for the characters 中 and 文.",
        showConfirmButton: false,
        style: {
          dialog: {
            width: '53%',
            left: '48%',
            top: '15%'
          },
          backdrop: {
            left: '50%',
            width: '50%',
            top: '51px'
          }
        }
      }
    });
  },

  /**
   * @method remove
   * @returns {Contact}
   */
  remove: function() {
    this.prompt.remove();

    return GelatoPage.prototype.remove.call(this);
  }
});

module.exports = DemoPage;
