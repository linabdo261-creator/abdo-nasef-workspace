export class FlightEngine {
  public controls = { pitch: 0, roll: 0, yaw: 0, throttle: 0 };
  private state = { altitude: 0, heading: 0, airspeed: 0, pitch: 0, roll: 0 };

  public update() {
    this.state.airspeed = this.controls.throttle * 150;
    this.state.altitude += (this.controls.pitch * (this.state.airspeed / 100)) * 0.1;
    this.state.heading += this.controls.yaw * 0.5;
    this.state.pitch = this.controls.pitch * 15;
    this.state.roll = this.controls.roll * 30;
  }

  public getState() {
    return { ...this.state };
  }
}
