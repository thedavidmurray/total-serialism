import vsketch


class MyFirstSketch(vsketch.SketchClass):
    # Parameters that can be tweaked in the GUI
    circle_count = vsketch.Param(50, 10, 100)
    min_radius = vsketch.Param(5, 1, 20)
    max_radius = vsketch.Param(50, 20, 100)

    def draw(self, vsk: vsketch.Vsketch) -> None:
        vsk.size("a4", landscape=False)

        # Draw random circles
        for i in range(self.circle_count):
            # Random position
            x = vsk.random(vsk.width)
            y = vsk.random(vsk.height)

            # Random radius
            radius = vsk.random(self.min_radius, self.max_radius)

            # Draw circle
            vsk.circle(x, y, radius)

    def finalize(self, vsk: vsketch.Vsketch) -> None:
        # Automatic optimization with vpype
        vsk.vpype("linemerge linesimplify reloop linesort")


if __name__ == "__main__":
    MyFirstSketch.display()
