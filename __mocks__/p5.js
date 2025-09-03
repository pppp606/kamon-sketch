class MockP5 {
  constructor(sketch) {
    if (sketch && typeof sketch === 'function') {
      sketch(this);
    }
  }
}

MockP5.prototype.createCanvas = jest.fn().mockReturnThis();
MockP5.prototype.background = jest.fn().mockReturnThis();
MockP5.prototype.clear = jest.fn().mockReturnThis();
MockP5.prototype.stroke = jest.fn().mockReturnThis();
MockP5.prototype.strokeWeight = jest.fn().mockReturnThis();
MockP5.prototype.line = jest.fn().mockReturnThis();
MockP5.prototype.fill = jest.fn().mockReturnThis();
MockP5.prototype.ellipse = jest.fn().mockReturnThis();

MockP5.prototype.setup = null;
MockP5.prototype.draw = null;

module.exports = MockP5;