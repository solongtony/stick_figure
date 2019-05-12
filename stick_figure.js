// Depends on point.js

// Scaling factor.
// Determines the ration of line width figure size.
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
Return an SVG element for a line.
@param Point start
@param Point end
@param String stroke color, default white.
@param Int stroke_width in pixels default 2.
*/
function svg_line(start, end) {
  return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>`;
}

function svg_ellipse(center, radii) {
  return `<ellipse cx="${center.x}" cy="${center.y}" rx="${radii.x}" ry="${radii.y}"/>`;
}

function offset_ellipse(base, direction, xr, yr) {
  // TODO: offset by an actual angle.
  // This assumes the offset is up/down, which will break.
  const center = base.polar_add(direction, yr);
  return svg_ellipse(center, new Point(xr, yr));
}

function rand_shift(n) {
  return (Math.random()/16 - 1/32) * n ;
}

// Array.from(p, ([key, value]) => value * value)

class StickFigure {
  constructor(id, center_of_gravity = new Point(0, 0), scale = 1) {
    this.id = name;
    this.hip_nexus = center_of_gravity;
    this.body_lengths = new Map(Array.from(BODY_LENGTHS, ([k, v]) => [k, v * scale]));
  }

  // Create svg elements to draw the stick figure.
  inner_svg() {
    // Would start from the center of mass, but that is the middle of the belly.
    // Starting from bottom of the belly, aka nexus of the hips and belly, aka groin.
    return [
      // The stick figure
      this.group_open(),
      // Heading Up
      // The torso must be drawn before arms, neck etc.
      // because it determins where the cneter of the shoulders are.
      this.torso(),
      this.neck_head(),
      // Arms include shoulders.
      this.right_arm(),
      this.left_arm(),
      // Heading Down
      // Legs include hips
      this.right_leg(),
      this.left_leg(),
      this.group_close()
    ].flat()
    .join("\n");
  }

  group_open() { return `<g id="{this.id}">`; }

  group_close() { return'</g>'; }

  axis() {
    return [

    ];
  }

  // Side Effect! Sets `shoulder_nexus`
  torso() {
    const belly_end = this.extend(this.hip_nexus ,'up', 'belly');
    const ribs_end = this.extend(belly_end ,'up', 'ribs');
    this.shoulder_nexus = ribs_end;
    return [
      svg_line(this.hip_nexus, belly_end),
      svg_line(belly_end, ribs_end)
    ];
  }

  neck_head() {
    const neck_end = this.extend(this.shoulder_nexus ,'up', 'neck');
    return [
      svg_line(this.shoulder_nexus, neck_end),
      offset_ellipse(neck_end, DIRECTIONS.get('up'), this.body_lengths.get('head_half_width'), this.body_lengths.get('head_half_height'))
    ];
  }

  right_arm() {
    const shoulder_end = this.extend(this.shoulder_nexus ,'right', 'shoulder');
    const upper_arm_end = this.extend(shoulder_end ,'down', 'upper_arm');
    const lower_arm_end = this.extend(upper_arm_end ,'down', 'lower_arm');
    return [
      svg_line(this.shoulder_nexus, shoulder_end),
      svg_line(shoulder_end, upper_arm_end),
      svg_line(upper_arm_end, lower_arm_end),
      offset_ellipse(lower_arm_end, DIRECTIONS.get('down'), this.body_lengths.get('hand_half_width'), this.body_lengths.get('hand_half_height'))
    ];
  }

  left_arm() {
    const shoulder_end = this.extend(this.shoulder_nexus ,'left', 'shoulder');
    const upper_arm_end = this.extend(shoulder_end ,'down', 'upper_arm');
    const lower_arm_end = this.extend(upper_arm_end ,'down', 'lower_arm');
    return [
      svg_line(this.shoulder_nexus, shoulder_end),
      svg_line(shoulder_end, upper_arm_end),
      svg_line(upper_arm_end, lower_arm_end),
      offset_ellipse(lower_arm_end, DIRECTIONS.get('down'), this.body_lengths.get('hand_half_width'), this.body_lengths.get('hand_half_height'))
    ];
  }

  right_leg() {
    const hip_end = this.extend(this.hip_nexus ,'right', 'hip');
    const upper_leg_end = this.extend(hip_end ,'down', 'upper_leg');
    const lower_leg_end = this.extend(upper_leg_end ,'down', 'lower_leg');
    return [
      svg_line(this.hip_nexus, hip_end),
      svg_line(hip_end, upper_leg_end),
      svg_line(upper_leg_end, lower_leg_end),
      offset_ellipse(lower_leg_end, DIRECTIONS.get('down'), this.body_lengths.get('foot_half_width'), this.body_lengths.get('foot_half_height'))
    ];
  }

  left_leg() {
    const hip_end = this.extend(this.hip_nexus ,'left', 'hip');
    const upper_leg_end = this.extend(hip_end ,'down', 'upper_leg');
    const lower_leg_end = this.extend(upper_leg_end ,'down', 'lower_leg');
    return [
      svg_line(this.hip_nexus, hip_end),
      svg_line(hip_end, upper_leg_end),
      svg_line(upper_leg_end, lower_leg_end),
      offset_ellipse(lower_leg_end, DIRECTIONS.get('down'), this.body_lengths.get('foot_half_width'), this.body_lengths.get('foot_half_height'))
    ];
  }

  extend(start, direction, body_part) {
    // Dance!
    // Random bend in joints.
    // Bigger bends in arms and legs
    // var multiplier;
    // switch(body_part.match(/leg|arm/)[0]) {
    //   case "arm": multiplier = 8; console.log("arm"); break;
    //   case "leg": multiplier = 3; console.log("leg"); break;
    //   default: multiplier = 1;
    // }
    // This is the actual this.extend logic.
    return start.polar_add(
      DIRECTIONS.get(direction) + rand_shift(4),
      this.body_lengths.get(body_part));
  }
}