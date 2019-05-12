class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(other) {
    return new Point(this.x + other.x, this.y + other.y);
  }

  add(x, y) {
    return new Point(this.x + x, this.y + y);
  }

  /**
  Offsets a starting point to a new point using polar coordinates.
  Uses units of Pi radians, aka quadrants.
  @param Number rotation in Pi radians: 0 = 0 deg, 0.5 = 90 deg, 1 = 180 deg.
  @param Number length
  @return Point the offset point.
  */
  polar_add(rotation, length) {
    // x = r cos theta
    const dx = length * Math.cos(rotation * Math.PI);
    // y = r sin theta
    const dy = length * Math.sin(rotation * Math.PI);

    return this.add(dx, dy);
  }
}