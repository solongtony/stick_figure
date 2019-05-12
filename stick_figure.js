// Depends on point.js

// Scaling factor.
// Helps determine the ratio of line width vs figure size.
const FACTOR = 10;

// Proportions measured in heads.
const BODY_LENGTHS = new Map([
  ['head_half_height', 0.5 * FACTOR],
  ['head_half_width', 0.3 * FACTOR],
  ['neck', 0.5 * FACTOR],
  ['ribs', 1 * FACTOR],
  ['belly', 1 * FACTOR],
  ['shoulder', 0.75 * FACTOR],
  ['upper_arm', 1.25 * FACTOR],
  ['lower_arm', 1 * FACTOR],
  ['hand_half_height', 0.3 * FACTOR],
  ['hand_half_width', 0.2 * FACTOR],
  ['hip', 0.5 * FACTOR],
  ['upper_leg', 1.5 * FACTOR],
  ['lower_leg', 1.5 * FACTOR],
  ['foot_half_height', 0.15 * FACTOR],
  ['foot_half_width', 0.3 * FACTOR],
]);

// Directions in Pi radians.
const DIRECTIONS = new Map([
  ['right', 0.0],
  ['up', 0.5],
  ['left', 1.0],
  ['down', 1.5]
]);

/**
@param Point start
@param Point end
@return an svg element string for a line.z
*/
function svg_line(start, end) {
  return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>`;
}

/**
@param Point center
@param Point radii, the x-axis radius and y-axis radius.
@return an svg element string for an ellipse.
*/
function svg_ellipse(center, radii) {
  // TODO: support a slanted elipse.
  return `<ellipse cx="${center.x}" cy="${center.y}" rx="${radii.x}" ry="${radii.y}"/>`;
}

/**
Create an ellipse with a center that is offset from the given base.
@param Point base
@param Number direction
@param Number xr x-axis radius
@param Number yr y-axis radius
*/
function offset_ellipse(base, direction, xr, yr) {
  // TODO: offset by an actual angle.
  // This assumes the offset is up/down (y axis),
  // which will break if the offset is actually more left right.
  const center = base.polar_add(direction, yr);
  return svg_ellipse(center, new Point(xr, yr));
}

/**
@param Number n is a facttor
@return Number between (-1/32 to 1/32) times n
*/
function rand_shift(n) {
  return (Math.random()/16 - 1/32) * n ;
}

class StickFigure {
  constructor(id, center_of_gravity = new Point(0, 0), scale = 1, width = 1) {
    this.id = id;
    this.hip_nexus = center_of_gravity;
    // How you map over a Map: Array.from(p, ([key, value]) => value * value)
    this.body_lengths = new Map(Array.from(BODY_LENGTHS, ([k, v]) => [k, v * scale]));
    this.width = width;
  }

  // Create svg elements to draw the stick figure.
  inner_svg() {
    // Would start from the center of mass, but that is the middle of the belly.
    // Starting from bottom of the belly, aka nexus of the hips and belly, aka groin.
    return [
      // These elements are being inserted into their own <g/> in the DOM.
      // Heading up the spine.
      // The torso must be drawn before arms, neck etc.
      // because it determins where the center of the shoulders are.
      this.torso(),
      this.neck_head(),
      // Arms include shoulders.
      this.right_arm(),
      this.left_arm(),
      // Heading down.
      // Legs include hips
      this.right_leg(),
      this.left_leg(),
    ].flat()
    .join("\n");
  }

  // TODO: use polyline instead of multiple lines.

  // Side Effect! Sets `shoulder_nexus`
  torso() {
    const belly_end = this.shifted_extend(this.hip_nexus ,'up', 'belly');
    const ribs_end = this.shifted_extend(belly_end ,'up', 'ribs');
    this.shoulder_nexus = ribs_end;
    return [
      svg_line(this.hip_nexus, belly_end),
      svg_line(belly_end, ribs_end)
    ];
  }

  // `shoulder_nexus` must be set by `torso()` first
  neck_head() {
    const neck_end = this.shifted_extend(this.shoulder_nexus ,'up', 'neck');
    return [
      svg_line(this.shoulder_nexus, neck_end),
      offset_ellipse(neck_end, DIRECTIONS.get('up'), this.body_lengths.get('head_half_width'), this.body_lengths.get('head_half_height'))
    ];
  }

  // `shoulder_nexus` must be set by `torso()` first
  right_arm() {
    const shoulder_end = this.shifted_extend(this.shoulder_nexus ,'right', 'shoulder');
    const upper_arm_end = this.shifted_extend(shoulder_end ,'down', 'upper_arm');
    const lower_arm_end = this.shifted_extend(upper_arm_end ,'down', 'lower_arm');
    return [
      svg_line(this.shoulder_nexus, shoulder_end),
      svg_line(shoulder_end, upper_arm_end),
      svg_line(upper_arm_end, lower_arm_end),
      offset_ellipse(
        lower_arm_end,
        DIRECTIONS.get('down'),
        this.body_lengths.get('hand_half_width'),
        this.body_lengths.get('hand_half_height'))
    ];
  }

  // `shoulder_nexus` must be set by `torso()` first
  left_arm() {
    const shoulder_end = this.shifted_extend(this.shoulder_nexus ,'left', 'shoulder');
    const upper_arm_end = this.shifted_extend(shoulder_end ,'down', 'upper_arm');
    const lower_arm_end = this.shifted_extend(upper_arm_end ,'down', 'lower_arm');
    return [
      svg_line(this.shoulder_nexus, shoulder_end),
      svg_line(shoulder_end, upper_arm_end),
      svg_line(upper_arm_end, lower_arm_end),
      offset_ellipse(
        lower_arm_end,
        DIRECTIONS.get('down'),
        this.body_lengths.get('hand_half_width'),
        this.body_lengths.get('hand_half_height'))
    ];
  }

  right_leg() {
    const hip_end = this.shifted_extend(this.hip_nexus ,'right', 'hip');
    const upper_leg_end = this.shifted_extend(hip_end ,'down', 'upper_leg');
    const lower_leg_end = this.shifted_extend(upper_leg_end ,'down', 'lower_leg');
    return [
      svg_line(this.hip_nexus, hip_end),
      svg_line(hip_end, upper_leg_end),
      svg_line(upper_leg_end, lower_leg_end),
      offset_ellipse(
        lower_leg_end,
        DIRECTIONS.get('down'),
        this.body_lengths.get('foot_half_width'),
        this.body_lengths.get('foot_half_height'))
    ];
  }

  left_leg() {
    const hip_end = this.shifted_extend(this.hip_nexus ,'left', 'hip');
    const upper_leg_end = this.shifted_extend(hip_end ,'down', 'upper_leg');
    const lower_leg_end = this.shifted_extend(upper_leg_end ,'down', 'lower_leg');
    return [
      svg_line(this.hip_nexus, hip_end),
      svg_line(hip_end, upper_leg_end),
      svg_line(upper_leg_end, lower_leg_end),
      offset_ellipse(
        lower_leg_end,
        DIRECTIONS.get('down'),
        this.body_lengths.get('foot_half_width'),
        this.body_lengths.get('foot_half_height'))
    ];
  }

  /**
  This thin wrapper around polar_add does some lookups and adds a random jitter
  to the direction.
  */
  shifted_extend(start, direction, body_part) {
    if(isNaN(direction)) {
      // Look up the named direction.
      direction = DIRECTIONS.get(direction);
    }
    // Dance!
    // Random bend in joints, for dance moves.
    var extent = 1;
    switch (body_part)
    {
      //case "neck":
      case "belly":
      case "upper_arm":
      case "lower_arm":
      case "upper_leg":
      case "lower_leg":
        // Joints with big movements.
        extent = 4;
      break;
    }
    return this.extend(start, direction + rand_shift(extent), body_part);
  }

  /**
  This thin wrapper around polar_add just does some lookups.
  */
  extend(start, direction, body_part) {
    if(isNaN(direction)) {
      // Look up the named direction.
      direction = DIRECTIONS.get(direction);
    }
    return start.polar_add(direction, this.body_lengths.get(body_part));
  }
}