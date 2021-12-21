var Label = require("./Label");


module.exports = PlainLink;

/**
 * A link connects at least two VOWL nodes.
 * The properties connecting the VOWL nodes are stored separately into the label.
 * @param domain
 * @param range
 * @param property
 */
function PlainLink( domain, range, property ){
  var layers,
    layerIndex,
    loops,
    loopIndex,
    pathEl,
    label = new Label(property, this);
  
  var backPart = require("./linkPart")(domain, label, this),
    frontPart = require("./linkPart")(label, range, this);
  
  
  this.layers = function ( p ){
    if ( !arguments.length ) return layers;
    layers = p;
    return this;
  };
  
  this.layerIndex = function ( p ){
    if ( !arguments.length ) return layerIndex;
    layerIndex = p;
    return this;
  };
  
  this.loops = function ( p ){
    if ( !arguments.length ) return loops;
    loops = p;
    return this;
  };
  
  this.loopIndex = function ( p ){
    if ( !arguments.length ) return loopIndex;
    loopIndex = p;
    return this;
  };
  
  
  this.domain = function (){
    return domain;
  };
  
  this.label = function (){
    return label;
  };
  
  this.linkParts = function (){
    return [frontPart, backPart];
  };
  
  this.range = function (){
    return range;
  };
  this.pathObj = function ( pE ){
    if ( !arguments.length ) {
      return pathEl;
    }
    pathEl = pE;
  };
}


PlainLink.prototype.draw = function ( linkGroup ){
  var property = this.label().property();
  var inverse = this.label().inverse();
  
  property.linkGroup(linkGroup);
  if ( inverse ) {
    inverse.linkGroup(linkGroup);
  }
  
  var pathElement = linkGroup.append("path");
  pathElement.classed("link-path", true)
      .classed(this.domain().cssClassOfNode(), true)
      .classed(this.range().cssClassOfNode(), true)
      .classed(property.linkType(), true);
  this.pathObj(pathElement);

  if (property.labelForCurrentLanguage() === "mapping") {
      if (property.annotations().status[0].value == "unreviewed") {
          linkGroup.selectAll("path, text").classed("unreviewed", true);
      } else if (property.annotations().status[0].value == "correct") {
          linkGroup.selectAll("path, text").classed("correct", true);

      } else if (property.annotations().status[0].value == "incorrect") {
          linkGroup.selectAll("path, text").classed("incorrect", true);

      } else if (property.annotations().status[0].value == "unsure") {
          linkGroup.selectAll("path, text").classed("unsure", true);
      }

  }

};


PlainLink.prototype.inverse = function() {
  return this.label().inverse();
};

PlainLink.prototype.isLoop = function() {
  return this.domain().equals(this.range());
};

PlainLink.prototype.property = function() {
  return this.label().property();
};