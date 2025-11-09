import vsketch
import numpy as np
from dataclasses import dataclass
from typing import List


@dataclass
class Particle:
    x: float
    y: float
    vx: float = 0.0
    vy: float = 0.0
    path: List = None

    def __post_init__(self):
        if self.path is None:
            self.path = []


class ParticlesSketch(vsketch.SketchClass):
    # Parameters
    particle_count = vsketch.Param(1000, 100, 5000)
    simulation_steps = vsketch.Param(100, 10, 500)

    # Forces
    gravity = vsketch.Param(0.1, 0.0, 1.0)
    wind_strength = vsketch.Param(0.05, 0.0, 0.5)
    turbulence = vsketch.Param(0.02, 0.0, 0.1)

    # Attractors
    use_attractors = vsketch.Param(True)
    attractor_count = vsketch.Param(3, 0, 10)
    attractor_strength = vsketch.Param(50.0, 0.0, 200.0)

    # Rendering
    min_path_length = vsketch.Param(5, 2, 20)
    fade_paths = vsketch.Param(True)

    def draw(self, vsk: vsketch.Vsketch) -> None:
        vsk.size("a3", landscape=True)

        # Initialize particles
        particles = []
        for _ in range(self.particle_count):
            particle = Particle(
                x=vsk.random(vsk.width * 0.2, vsk.width * 0.8),
                y=vsk.random(10, 50),  # Start near top
                vx=vsk.random(-0.5, 0.5),
                vy=vsk.random(0, 1),
            )
            particles.append(particle)

        # Create attractors if enabled
        attractors = []
        if self.use_attractors:
            for _ in range(self.attractor_count):
                attractors.append(
                    {
                        "x": vsk.random(vsk.width * 0.1, vsk.width * 0.9),
                        "y": vsk.random(vsk.height * 0.3, vsk.height * 0.8),
                        "strength": vsk.random(0.5, 1.5) * self.attractor_strength,
                    }
                )

        # Simulate particle movement
        for step in range(self.simulation_steps):
            for particle in particles:
                # Record position
                particle.path.append((particle.x, particle.y))

                # Apply gravity
                particle.vy += self.gravity

                # Apply wind (horizontal force with noise)
                wind = self.wind_strength * vsk.noise(
                    particle.x * 0.01, particle.y * 0.01, step * 0.1
                )
                particle.vx += wind

                # Apply turbulence
                if self.turbulence > 0:
                    particle.vx += vsk.random(-self.turbulence, self.turbulence)
                    particle.vy += vsk.random(-self.turbulence, self.turbulence)

                # Apply attractor forces
                if self.use_attractors:
                    for attractor in attractors:
                        dx = attractor["x"] - particle.x
                        dy = attractor["y"] - particle.y
                        dist_sq = dx * dx + dy * dy

                        if dist_sq > 0.1:  # Avoid division by zero
                            force = attractor["strength"] / dist_sq
                            particle.vx += dx * force * 0.01
                            particle.vy += dy * force * 0.01

                # Update position
                particle.x += particle.vx
                particle.y += particle.vy

                # Damping
                particle.vx *= 0.98
                particle.vy *= 0.98

                # Boundary check
                if (
                    particle.x < 0
                    or particle.x > vsk.width
                    or particle.y < 0
                    or particle.y > vsk.height
                ):
                    break

        # Draw particle paths
        for particle in particles:
            if len(particle.path) < self.min_path_length:
                continue

            with vsk.pushMatrix():
                for i, (x, y) in enumerate(particle.path):
                    if i == 0:
                        vsk.moveTo(x, y)
                    else:
                        # Apply fading if enabled
                        if self.fade_paths:
                            alpha = i / len(particle.path)
                            vsk.strokeWeight(0.5 * alpha)
                        vsk.lineTo(x, y)

        # Draw attractors as reference points (will be removed in final)
        if self.use_attractors:
            vsk.strokeWeight(0.3)
            for attractor in attractors:
                vsk.circle(attractor["x"], attractor["y"], 5)

    def finalize(self, vsk: vsketch.Vsketch) -> None:
        # Optimize with vpype
        vsk.vpype("linemerge linesimplify reloop linesort")


if __name__ == "__main__":
    ParticlesSketch.display()
