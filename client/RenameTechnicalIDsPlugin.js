'use strict';

var removeDiacritics = require('diacritics').remove;
var domify = require('min-dom/lib/domify'),
    domEvent = require('min-dom/lib/event'),
    domClasses = require('min-dom/lib/classes'),
    domQuery = require('min-dom/lib/query'),
    clear = require('min-dom/lib/clear');

function toGreeklish(text) {
      const GR = Array.from("ΑΆΒΓΔΕΈΖΗΉΙΊΪΚΛΜΝΞΟΌΠΡΣΤΥΎΫΦΩΏαάβγδεέζηήιίϊΐκλμνξοόπρσςτυύϋΰφωώ");
      const EN = Array.from("AAVGDEEZIIIIIKLMNXOOPRSTYYYFOOaavgdeeziiiiiiklmnxooprsstyyyyfoo");
      const translation_dictionary = new Map();
      for (let i = 0; i < GR.length; i++) {
          translation_dictionary.set(GR[i], EN[i]);
      }
      const syllables = [
          ['γχ', 'nch'], ['αυ(?=[θκξπστφχψ])', 'af'], ['ευ(?=[θκξπστφχψ|\s|$])', 'ef'], ['εύ(?=[θκξπστφχψ|\s|$])', 'ef'],
          ['ηυ(?=[θκξπστφχψ|\s|$])', 'if'], ['(?=^|\s|$)μπ', 'b'], ['μπ(?=^|\s|$)', 'b'],
          ['αι', 'ai'], ['οι', 'oi'], ['ου', 'ou'], ['ού', 'ou'], ['ει', 'ei'], ['ντ', 'nt'], ['τσ', 'ts'],
          ['τζ', 'tz'], ['γγ', 'ng'], ['γκ', 'gk'], ['θ', 'th'], ['χ', 'ch'], ['ψ', 'ps'],
          ['αυ', 'av'], ['ευ', 'ev'], ['ηυ', 'if'], ['μπ', 'mp'],
          ['Γχ', 'Nch'], ['Αυ(?=[θκξπστφχψ])', 'Af'], ['Ευ(?=[θκξπστφχψ|\s|$])', 'Ef'], ['Εύ(?=[θκξπστφχψ|\s|$])', 'Ef'],
          ['Ηυ(?=[θκξπστφχψ|\s|$])', 'If'], ['(?=^|\s|$)Μπ', 'B'], ['Μπ(?=^|\s|$)', 'B'],
          ['Αι', 'Ai'], ['Οι', 'Oi'], ['Ου', 'Ou'], ['Ού', 'Ou'], ['Ει', 'Ei'], ['Ντ', 'Nt'], ['Τς', 'Ts'],
          ['Τζ', 'Tz'], ['Γγ', 'Ng'], ['Γκ', 'Gk'], ['Θ(?=[α-ω])', 'Th'], ['Χ(?=[α-ω])', 'Ch'], ['Ψ(?=[α-ω])', 'Ps'],
          ['Αυ', 'Av'], ['Ευ', 'Ev'], ['Ηυ', 'If'], ['Μπ', 'Mp'],
          ['ΓΧ', 'NCH'], ['ΑΥ(?=[ΘΚΞΠΣΤΦΧΨ])', 'AF'], ['ΕΥ(?=[ΘΚΞΠΣΤΦΧΨ|\s|$])', 'EF'], ['ΕΎ(?=[ΘΚΞΠΣΤΦΧΨ|\s|$])', 'EF'],
          ['ΗΥ(?=[ΘΚΞΠΣΤΦΧΨ|\s|$])', 'IF'], ['(?=^|\s|$)ΜΠ', 'B'], ['ΜΠ(?=^|\s|$)', 'B'],
          ['ΑΙ', 'AI'], ['ΟΙ', 'OI'], ['ΟΥ', 'OU'], ['ΟΎ', 'OU'], ['ΕΙ', 'EI'], ['ΝΤ', 'NT'], ['ΤΣ', 'TS'],
          ['ΤΖ', 'TZ'], ['ΓΓ', 'NG'], ['ΓΚ', 'GK'], ['Θ(?=[Α-Ω|\s|$])', 'TH'], ['Χ(?=[Α-Ω|\s|$])', 'CH'], ['Ψ(?=[Α-Ω|\s|$])', 'PS'],
          ['ΑΥ', 'AV'], ['ΕΥ', 'EV'], ['ΗΥ', 'IF'], ['ΜΠ', 'B']
      ];
      for (let i = 0; i < syllables.length; i++) {
          text = text.replace(new RegExp(syllables[i][0], 'g'), syllables[i][1]);
      }
      for (let key of translation_dictionary.keys()) {
          text = text.replace(new RegExp(key, 'g'), "" + translation_dictionary.get(key));
      }
      return text;
    }

function RenameTechnicalIDsPlugin(elementRegistry, editorActions, canvas, modeling) {
  this._elementRegistry = elementRegistry;
  this._modeling = modeling;

  var self = this;

  this.state = {
    open: false
  };

  editorActions.register({
    generateIDs: function() {
      self.generateAndShow();
    }
  });

  this.addRenameIDsContainer(canvas.getContainer().parentNode);
}


RenameTechnicalIDsPlugin.prototype.generateAndShow = function() {
  if (!this.state.open) {
    this.toggle();
  }
  this.generateIDs();
  this.showIDs();
};

RenameTechnicalIDsPlugin.prototype.addRenameIDsContainer = function(container) {
  var self = this;
  var markup = '<div class="djs-popup djs-rename-technical-ids"> \
    <div class="djs-rename-technical-ids-container"> \
      <button class="generate-ids">Generate IDs</button> \
      <button class="rename-ids">Rename IDs</button> \
      <ul class="id-list"></ul> \
    </div> \
    <div class="djs-rename-technical-ids-toggle">ID Renaming</div> \
    </div>';
  this.element = domify(markup);

  container.appendChild(this.element);

  domEvent.bind(domQuery('.djs-rename-technical-ids-toggle', this.element), 'click', function(event) {
    self.toggle();
  });
  domEvent.bind(domQuery('.generate-ids', this.element), 'click', function(event) {
    self.generateIDs();
    self.showIDs();
  });
  domEvent.bind(domQuery('.rename-ids', this.element), 'click', function(event) {
    self.retry = 0;
    self.renameIDs();
  });
};

RenameTechnicalIDsPlugin.prototype.toggle = function() {
  if (this.state.open) {
    domClasses(this.element).remove('open')

    this.state.open = false;
  } else {
    domClasses(this.element).add('open')

    this.state.open = true;
  }
};

RenameTechnicalIDsPlugin.prototype.generateIDs = function() {
  var self = this;
  var elements = this._elementRegistry._elements;
  this.technicalIds = {};
  Object.keys(elements).forEach(function(key) {
    if ( elements[key].type != 'label' ) {
      var businessObject = elements[key].element.businessObject;
      if (businessObject != null && businessObject.name) {
        var technicalId = self._getTechnicalID(businessObject.name, businessObject.$type);
        self.technicalIds[businessObject.id] = technicalId;
      }
    }
  });
  this._verifyDuplicateIds();
};

RenameTechnicalIDsPlugin.prototype._verifyDuplicateIds = function() {
  var self = this;
  var values = {};
  Object.keys(this.technicalIds).forEach(function(technicalId) {
    var newTechnicalId = self.technicalIds[technicalId];
    if (values[newTechnicalId] != null) {
      values[newTechnicalId] = values[newTechnicalId] + 1;
      self.technicalIds[technicalId] = self.technicalIds[technicalId] + values[newTechnicalId];
    } else {
      values[newTechnicalId] = 0;
    }
  });
};

RenameTechnicalIDsPlugin.prototype.showIDs = function() {
  var self = this;
  var idList = domQuery('.id-list',this.element);
  clear(idList);

  if (this.technicalIds != null) {
    Object.keys(this.technicalIds).forEach(function(technicalId) {
      if (technicalId == self.technicalIds[technicalId]) {
        idList.append(domify('<li>' + technicalId + ' --> ' + self.technicalIds[technicalId] + '</li>'));
      } else {
        idList.append(domify('<li>' + technicalId + ' --> <span  style="background-color:#ffbc00">' + self.technicalIds[technicalId] + '</span></li>'));
      }
    });
  }
};

RenameTechnicalIDsPlugin.prototype.renameIDs = function() {
  var self = this;

  Object.keys(this.technicalIds).forEach(function(technicalId) {
    if (technicalId != self.technicalIds[technicalId] && self._elementRegistry.get(self.technicalIds[technicalId]) != null) {
      self.retry = self.retry + 1;
    } else {
      var element = self._elementRegistry.get(technicalId);
      var properties = {
        id: self.technicalIds[technicalId]
      };
      self._modeling.updateProperties(element, properties);
    }
  });

  if (self.retry>0 && self.retry<100) {
    this.renameIDs();
  }
};

RenameTechnicalIDsPlugin.prototype._getTechnicalID = function(name, type) {
  var name = toGreeklish(name); // convert to elot 743
  name = removeDiacritics(name); // remove diacritics
  name = name.replace(/[^\w\s]/gi, ''); // now replace special characters
  name = this._getCamelCase(name);; // get camelcase
  
  if ( !isNaN(name.charAt(0)) ) { // mask leading numbers
     name = 'N' + name;
  }
  
  if ( type === 'bpmn:Process' ) {
    return name + 'Process';
  } else if ( type === 'bpmn:IntermediateCatchEvent' || type === 'bpmn:IntermediateThrowEvent' ) {
    return name + 'Event';
  } else if ( type === 'bpmn:UserTask' || type === 'bpmn:ServiceTask' || type === 'bpmn:ReceiveTask' || type === 'bpmn:SendTask' 
                || type === 'bpmn:ManualTask' || type === 'bpmn:BusinessRuleTask' || type === 'bpmn:ScriptTask' ) {
    return name + 'Task';
  } else if ( type === 'bpmn:ExclusiveGateway' || type === 'bpmn:ParallelGateway' || type === 'bpmn:ComplexGateway' 
                || type === 'bpmn:EventBasedGateway' ) {
    return name + 'Gateway';
  } else {
    return name + type.replace('bpmn:','');
  }
};

RenameTechnicalIDsPlugin.prototype._getCamelCase = function(str) {
  var camelCase = str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index == 0 ? match.toLowerCase() : match.toUpperCase();
  });
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};


RenameTechnicalIDsPlugin.$inject = [ 'elementRegistry', 'editorActions', 'canvas', 'modeling' ];

module.exports = {
    __init__: ['renameTechnicalIDsPlugin'],
    renameTechnicalIDsPlugin: ['type', RenameTechnicalIDsPlugin]
};
