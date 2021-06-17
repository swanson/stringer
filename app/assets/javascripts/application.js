//= require jquery-min.js
//= require bootstrap-min.js
//= require bootstrap.file-input.js
//= require mousetrap-min.js
//= require jquery-visible-min.js
//= require underscore-min.js
//= require backbone-min.js
//= require turbolinks-min.js

_.templateSettings = {
  interpolate: /\{\{\=(.+?)\}\}/g,
  evaluate: /\{\{(.+?)\}\}/g
};

var Story = Backbone.Model.extend({
  defaults: function() {
    return {
      "open" : false,
      "selected" : false
    }
  },

  toggle: function() {
    if (this.get("open")) {
      this.close();
    } else {
      this.open();
    }
  },

  shouldSave: function() {
    return this.changedAttributes() && this.get("id") > 0;
  },

  open: function() {
    if (!this.get("keep_unread")) this.set("is_read", true);
    if (this.shouldSave()) this.save();

    if(this.collection){
      this.collection.closeOthers(this);
      this.collection.unselectAll();
      this.collection.setSelection(this);
    }

    this.set("open", true);
    this.set("selected", true);
  },

  toggleKeepUnread: function() {
    if (this.get("keep_unread")) {
      this.set("keep_unread", false);
      this.set("is_read", true);
    } else {
      this.set("keep_unread", true);
      this.set("is_read", false);
    }

    if (this.shouldSave()) this.save();
  },

  toggleStarred: function() {
    if (this.get("is_starred")) {
      this.set("is_starred", false);
    } else {
      this.set("is_starred", true);
    }

    if (this.shouldSave()) this.save();
  },

  close: function() {
    this.set("open", false);
  },

  select: function() {
    if(this.collection) this.collection.unselectAll();
    this.set("selected", true);
  },

  unselect: function() {
    this.set("selected", false);
  },

  openInTab: function() {
    window.open(this.get("permalink"), '_blank');
  }
});

var StoryView = Backbone.View.extend({
  tagName: "li",
  className: "story",

  template: "#story-template",

  events: {
    "click .story-preview" : "storyClicked",
    "click .story-keep-unread" : "toggleKeepUnread",
    "click .story-starred" : "toggleStarred"
  },

  initialize: function() {
    this.template = _.template($(this.template).html());
    this.listenTo(this.model, 'add', this.render);
    this.listenTo(this.model, 'change:selected', this.itemSelected);
    this.listenTo(this.model, 'change:open', this.itemOpened);
    this.listenTo(this.model, 'change:is_read', this.itemRead);
    this.listenTo(this.model, 'change:keep_unread', this.itemKeepUnread);
    this.listenTo(this.model, 'change:is_starred', this.itemStarred);
  },

  render: function() {
    var jsonModel = this.model.toJSON();
    this.$el.html(this.template(jsonModel));
    if (jsonModel.is_read) {
      this.$el.addClass('read');
    }
    if (jsonModel.keep_unread) {
      this.$el.addClass('keepUnread');
    }
    return this;
  },

  itemRead: function() {
    this.$el.toggleClass("read", this.model.get("is_read"));
  },

  itemOpened: function() {
    if (this.model.get("open")) {
      this.$el.addClass("open");
      $(".story-lead", this.$el).fadeOut(1000);
      window.scrollTo(0, this.$el.offset().top);
    } else {
      this.$el.removeClass("open");
      $(".story-lead", this.$el).show();
    }
  },

  itemSelected: function() {
    this.$el.toggleClass("cursor", this.model.get("selected"));
    if (!this.$el.visible()) window.scrollTo(0, this.$el.offset().top);
  },

  itemKeepUnread: function() {
    var icon = this.model.get("keep_unread") ? "icon-check" : "icon-check-empty";
    this.$(".story-keep-unread > i").attr("class", icon);
    this.$el.toggleClass("keepUnread", this.model.get("keep_unread"));
  },

  itemStarred: function() {
    var icon = this.model.get("is_starred") ? "icon-star" : "icon-star-empty";
    this.$(".story-starred > i").attr("class", icon);
  },

  storyClicked: function(e) {
    if (e.metaKey || e.ctrlKey || e.which == 2) {
      var backgroundTab = window.open(this.model.get("permalink"));
      if (backgroundTab) backgroundTab.blur();
      window.focus();
      if (!this.model.get("keep_unread")) this.model.set("is_read", true);
      if (this.model.shouldSave()) this.model.save();
    } else {
      this.model.toggle();
      window.scrollTo(0, this.$el.offset().top);
    }
  },

  toggleKeepUnread: function() {
    this.model.toggleKeepUnread();
  },

  toggleStarred: function(e) {
    e.stopPropagation();
    this.model.toggleStarred();
  }
});

var StoryList = Backbone.Collection.extend({
  model: Story,
  url: "/stories",

  initialize: function() {
    this.cursorPosition = -1;
  },

  max_position: function() {
    return this.length - 1;
  },

  unreadCount: function() {
    return this.where({is_read: false}).length;
  },

  closeOthers: function(modelToSkip) {
    this.each(function(model) {
      if (model.id != modelToSkip.id) {
        model.close();
      }
    });
  },

  selected: function() {
    return this.where({selected: true});
  },

  unselectAll: function() {
    _.invoke(this.selected(), "unselect");
  },

  selectedStoryId: function() {
    var selectedStory = this.at(this.cursorPosition);
    return selectedStory ? selectedStory.id : -1;
  },

  setSelection: function(model) {
    this.cursorPosition = this.indexOf(model);
  },

  moveCursorDown: function() {
    if (this.cursorPosition < this.max_position()) {
      this.cursorPosition++;
    } else {
      this.cursorPosition = 0;
    }

    this.at(this.cursorPosition).select();
  },

  moveCursorUp: function() {
    if (this.cursorPosition > 0) {
      this.cursorPosition--;
    } else {
      this.cursorPosition = this.max_position();
    }

    this.at(this.cursorPosition).select();
  },

  openCurrentSelection: function() {
    this.at(this.cursorPosition).open();
  },

  toggleCurrent: function() {
    if (this.cursorPosition < 0) this.cursorPosition = 0;
    this.at(this.cursorPosition).toggle();
  },

  viewCurrentInTab: function() {
    if (this.cursorPosition < 0) this.cursorPosition = 0;
    this.at(this.cursorPosition).openInTab();
  },

  toggleCurrentKeepUnread: function() {
    if (this.cursorPosition < 0) this.cursorPosition = 0;
    this.at(this.cursorPosition).toggleKeepUnread();
  },

  toggleCurrentStarred: function() {
    if (this.cursorPosition < 0) this.cursorPosition = 0;
    this.at(this.cursorPosition).toggleStarred();
  }
});

var AppView = Backbone.View.extend({
  el: "#stories",

  initialize: function(collection) {
    this.stories = collection;
    this.el = $(this.el);

    this.listenTo(this.stories, 'add', this.addOne);
    this.listenTo(this.stories, 'reset', this.addAll);
    this.listenTo(this.stories, 'all', this.render);
  },

  loadData: function(data) {
    this.stories.reset(data);
  },

  render: function() {
    var unreadCount = this.stories.unreadCount();

    if (unreadCount === 0) {
      document.title = window.i18n.titleName;
    } else {
      document.title = "(" + unreadCount + ") " + window.i18n.titleName;
    }
  },

  addOne: function(story) {
    var view = new StoryView({model: story});
    this.$("#story-list").append(view.render().el);
  },

  addAll: function() {
    this.stories.each(this.addOne, this);
  },

  moveCursorDown: function() {
    this.stories.moveCursorDown();
  },

  moveCursorUp: function() {
    this.stories.moveCursorUp();
  },

  openCurrentSelection: function() {
    this.stories.openCurrentSelection();
  },

  toggleCurrent: function() {
    this.stories.toggleCurrent();
  },

  viewCurrentInTab: function() {
    this.stories.viewCurrentInTab();
  },

  toggleCurrentKeepUnread: function() {
    this.stories.toggleCurrentKeepUnread();
  },

  toggleCurrentStarred: function() {
    this.stories.toggleCurrentStarred();
  }
});

$(document).ready(function() {
  $(".remove-feed").click(function(e) {
    e.preventDefault();
    var $this = $(this);

    var feedId = $this.parents("li").data("id");

    if (feedId > 0) {
      $.ajax({url: "/feeds/" + feedId, type: "DELETE"})
       .success(function() {
          $this.parents("li").fadeOut(500, function () {
            $(this).remove();
          });
        })
       .fail(function() { alert("something broke!"); });
    }
  });

  Mousetrap.bind("?", function() {
    $("#shortcuts").modal('toggle');
  });
});
