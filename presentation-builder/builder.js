/**
 * SignalDesk Presentation Builder
 * Converts presentation data JSON into actual PowerPoint files using pptxgenjs
 */

const fs = require("fs").promises;
const path = require("path");
const pptxgen = require("pptxgenjs");

class PresentationBuilder {
  constructor(config = {}) {
    this.templatesDir = config.templatesDir || "./templates";
    this.outputDir = config.outputDir || "./output";
    this.workDir = config.workDir || "./output/slides";
  }

  /**
   * Build PowerPoint from presentation data
   */
  async buildPresentation(presentationData, outputFilename = "presentation.pptx") {
    console.log("\n🏗️  Building PowerPoint presentation...\n");

    try {
      // Create PowerPoint
      console.log("📊 Creating PowerPoint...");
      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_16x9";
      pptx.author = "SignalDesk AI";
      pptx.title = presentationData.title;
      pptx.subject = "AI-Generated Presentation";

      // Define theme colors
      const theme = presentationData.theme || {};
      const colors = {
        primary: theme.primary || "1a1a2e",
        secondary: theme.secondary || "16213e",
        accent: theme.accent || "0f3460",
        text: theme.text || "ffffff",
        background: theme.background || "f5f5f5"
      };

      // Add each slide
      for (let i = 0; i < presentationData.slides.length; i++) {
        const slideData = presentationData.slides[i];
        console.log(`  → Adding slide ${i + 1}: ${slideData.title}`);

        const slide = pptx.addSlide();

        switch (slideData.type) {
          case "title":
            this.addTitleSlide(slide, slideData, colors);
            break;
          case "chart":
            this.addChartSlide(slide, slideData, colors);
            break;
          case "timeline":
            this.addTimelineSlide(slide, slideData, colors);
            break;
          case "diagram":
            this.addDiagramSlide(slide, slideData, colors);
            break;
          case "visual":
            this.addVisualSlide(slide, slideData, colors);
            break;
          case "quote":
            this.addQuoteSlide(slide, slideData, colors);
            break;
          case "closing":
            this.addClosingSlide(slide, slideData, colors);
            break;
          default:
            this.addContentSlide(slide, slideData, colors);
        }

        // Add speaker notes if available
        if (slideData.notes) {
          slide.addNotes(slideData.notes);
        }
      }

      // Save presentation
      const outputPath = path.join(this.outputDir, outputFilename);
      await pptx.writeFile({ fileName: outputPath });
      console.log(`\n✅ Presentation saved: ${outputPath}`);

      return outputPath;

    } catch (error) {
      console.error("❌ Error building presentation:", error);
      throw error;
    }
  }

  /**
   * Add title slide
   */
  addTitleSlide(slide, data, colors) {
    // Background gradient
    slide.background = { fill: colors.primary };

    // Main title
    slide.addText(data.title, {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1.5,
      fontSize: 44,
      bold: true,
      color: colors.text,
      align: "center",
      valign: "middle"
    });

    // Subtitle if available
    if (data.body && data.body.length > 0) {
      slide.addText(data.body[0], {
        x: 1,
        y: 4.2,
        w: 8,
        h: 0.8,
        fontSize: 24,
        color: colors.text,
        align: "center",
        valign: "middle"
      });
    }
  }

  /**
   * Add content slide (bullets or paragraphs)
   */
  addContentSlide(slide, data, colors) {
    // Background
    slide.background = { fill: colors.background };

    // Title
    slide.addText(data.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: colors.primary,
      align: "left"
    });

    // Check if content should be bullets or paragraphs
    const isBullets = data.body.every(item => item.length < 200);

    if (isBullets) {
      // Add as bullet points
      const bullets = data.body.map(item => ({ text: item, options: { bullet: true } }));

      slide.addText(bullets, {
        x: 0.75,
        y: 1.5,
        w: 8.5,
        h: 4,
        fontSize: 20,
        color: colors.primary,
        bullet: { type: "number" },
        lineSpacing: 28
      });
    } else {
      // Add as paragraphs
      let yPos = 1.5;
      for (const paragraph of data.body) {
        slide.addText(paragraph, {
          x: 0.75,
          y: yPos,
          w: 8.5,
          h: "auto",
          fontSize: 18,
          color: colors.primary,
          lineSpacing: 24
        });
        yPos += 1.2;
        if (yPos > 5) break; // Prevent overflow
      }
    }
  }

  /**
   * Add visual slide (text + image placeholder)
   */
  addVisualSlide(slide, data, colors) {
    // Background
    slide.background = { fill: colors.background };

    // Title
    slide.addText(data.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: colors.primary,
      align: "left"
    });

    // Left column: Text content
    const textContent = data.body.join("\n\n");
    slide.addText(textContent, {
      x: 0.5,
      y: 1.5,
      w: 4.5,
      h: 4,
      fontSize: 18,
      color: colors.primary,
      lineSpacing: 24,
      valign: "top"
    });

    // Right column: Image or placeholder
    if (data.imageUrl) {
      // Add actual Vertex AI generated image
      slide.addImage({
        path: data.imageUrl,
        x: 5.5,
        y: 1.5,
        w: 4,
        h: 4,
        sizing: { type: "cover" }
      });
    } else {
      // Add placeholder if no image available
      const placeholderText = data.visualDescription || "Visual placeholder";

      slide.addShape("rect", {
        x: 5.5,
        y: 1.5,
        w: 4,
        h: 4,
        fill: { color: colors.secondary }
      });

      slide.addText(placeholderText, {
        x: 5.5,
        y: 3,
        w: 4,
        h: 1,
        fontSize: 16,
        color: colors.text,
        align: "center",
        valign: "middle"
      });
    }
  }

  /**
   * Add quote slide
   */
  addQuoteSlide(slide, data, colors) {
    // Background gradient
    slide.background = { fill: colors.secondary };

    const quote = data.body[0] || '';
    const attribution = data.body[1] || '';

    // Quote text
    slide.addText(`"${quote}"`, {
      x: 1.5,
      y: 2,
      w: 7,
      h: 2,
      fontSize: 28,
      italic: true,
      color: colors.text,
      align: "center",
      valign: "middle",
      lineSpacing: 32
    });

    // Attribution
    if (attribution) {
      slide.addText(`— ${attribution}`, {
        x: 1.5,
        y: 4.5,
        w: 7,
        h: 0.5,
        fontSize: 20,
        color: colors.text,
        align: "right"
      });
    }
  }

  /**
   * Add closing slide
   */
  addClosingSlide(slide, data, colors) {
    // Background gradient
    slide.background = { fill: colors.primary };

    // Main title
    slide.addText(data.title, {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1.2,
      fontSize: 40,
      bold: true,
      color: colors.text,
      align: "center",
      valign: "middle"
    });

    // Call to action or next steps
    if (data.body && data.body.length > 0) {
      const ctaText = data.body.join("\n");
      slide.addText(ctaText, {
        x: 2,
        y: 3.5,
        w: 6,
        h: 1.5,
        fontSize: 22,
        color: colors.text,
        align: "center",
        valign: "middle",
        lineSpacing: 28
      });
    }
  }

  /**
   * Add chart slide
   */
  addChartSlide(slide, data, colors) {
    // Background
    slide.background = { fill: colors.background };

    // Title
    slide.addText(data.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: colors.primary,
      align: "left"
    });

    // Get chart data from visual_element or default
    const chartElement = data.visual_element || {};
    const chartType = chartElement.chart_type || 'bar';
    const chartData = chartElement.data || {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      values: [65, 70, 80, 85]
    };

    // Prepare chart data for pptxgenjs
    const chartDataSeries = [{
      name: chartData.name || 'Series 1',
      labels: chartData.labels || ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
      values: chartData.values || [30, 50, 70, 90]
    }];

    // Add chart
    slide.addChart(pptx.ChartType[chartType] || pptx.ChartType.bar, chartDataSeries, {
      x: 1,
      y: 1.5,
      w: 8,
      h: 4,
      chartColors: [colors.accent, colors.primary, colors.secondary],
      showTitle: false,
      showLegend: chartData.showLegend !== false,
      showValue: true,
      valAxisMaxVal: chartData.maxValue,
      catAxisLabelFontSize: 12,
      valAxisLabelFontSize: 12
    });

    // Add description if available
    if (data.body && data.body.length > 0) {
      slide.addText(data.body[0], {
        x: 0.75,
        y: 5.7,
        w: 8.5,
        h: 0.5,
        fontSize: 14,
        color: colors.primary,
        italic: true
      });
    }
  }

  /**
   * Add timeline slide
   */
  addTimelineSlide(slide, data, colors) {
    // Background
    slide.background = { fill: colors.background };

    // Title
    slide.addText(data.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: colors.primary,
      align: "left"
    });

    // Get timeline data
    const timelineElement = data.visual_element || {};
    const events = timelineElement.data?.events || [
      { date: "Jan 2024", description: "Event 1" },
      { date: "Mar 2024", description: "Event 2" },
      { date: "Jun 2024", description: "Event 3" }
    ];

    // Draw timeline line
    slide.addShape(pptx.ShapeType.line, {
      x: 1,
      y: 3,
      w: 8,
      h: 0,
      line: { color: colors.accent, width: 3 }
    });

    // Add events
    events.forEach((event, index) => {
      const xPos = 1 + (index * (8 / Math.max(events.length - 1, 1)));
      const yPos = 3;

      // Timeline marker (circle)
      slide.addShape(pptx.ShapeType.ellipse, {
        x: xPos - 0.15,
        y: yPos - 0.15,
        w: 0.3,
        h: 0.3,
        fill: { color: colors.accent }
      });

      // Date
      slide.addText(event.date, {
        x: xPos - 0.5,
        y: yPos - 0.7,
        w: 1,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: colors.primary,
        align: "center"
      });

      // Description
      slide.addText(event.description, {
        x: xPos - 0.75,
        y: yPos + 0.4,
        w: 1.5,
        h: 0.8,
        fontSize: 10,
        color: colors.primary,
        align: "center",
        valign: "top"
      });
    });
  }

  /**
   * Add diagram slide
   */
  addDiagramSlide(slide, data, colors) {
    // Background
    slide.background = { fill: colors.background };

    // Title
    slide.addText(data.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: colors.primary,
      align: "left"
    });

    // Get diagram data
    const diagramElement = data.visual_element || {};
    const nodes = diagramElement.data?.nodes || [
      { label: "Step 1" },
      { label: "Step 2" },
      { label: "Step 3" }
    ];

    // Calculate positions
    const startX = 1;
    const startY = 2.5;
    const nodeWidth = 2;
    const nodeHeight = 1;
    const spacing = 0.5;
    const totalWidth = (nodes.length * nodeWidth) + ((nodes.length - 1) * spacing);
    const offsetX = (10 - totalWidth) / 2;

    // Draw nodes and arrows
    nodes.forEach((node, index) => {
      const xPos = offsetX + (index * (nodeWidth + spacing));

      // Node box
      slide.addShape(pptx.ShapeType.roundRect, {
        x: xPos,
        y: startY,
        w: nodeWidth,
        h: nodeHeight,
        fill: { color: colors.accent },
        line: { color: colors.primary, width: 2 }
      });

      // Node text
      slide.addText(node.label, {
        x: xPos,
        y: startY + 0.3,
        w: nodeWidth,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: colors.text,
        align: "center",
        valign: "middle"
      });

      // Arrow to next node
      if (index < nodes.length - 1) {
        slide.addShape(pptx.ShapeType.rightArrow, {
          x: xPos + nodeWidth,
          y: startY + 0.35,
          w: spacing,
          h: 0.3,
          fill: { color: colors.primary }
        });
      }
    });

    // Add description if available
    if (data.body && data.body.length > 0) {
      slide.addText(data.body.join('\n'), {
        x: 1,
        y: 4.5,
        w: 8,
        h: 1.5,
        fontSize: 14,
        color: colors.primary
      });
    }
  }
}

// CLI usage
if (require.main === module) {
  (async () => {
    const dataPath = process.argv[2] || "./output/presentation-data.json";
    const outputFilename = process.argv[3] || "signaldesk-presentation.pptx";

    try {
      // Load presentation data
      const data = JSON.parse(await fs.readFile(dataPath, "utf-8"));

      // Build presentation
      const builder = new PresentationBuilder({
        templatesDir: "./templates",
        outputDir: "./output",
        workDir: "./output/slides"
      });

      const outputPath = await builder.buildPresentation(data, outputFilename);

      console.log("\n🎉 Success!");
      console.log(`\n📦 Your presentation is ready: ${outputPath}`);
      console.log("\nNext steps:");
      console.log("  1. Open and review the presentation");
      console.log("  2. Customize colors and fonts as needed");
      console.log("  3. Replace visual placeholders with real images");

    } catch (error) {
      console.error("\n❌ Failed to build presentation:", error.message);
      process.exit(1);
    }
  })();
}

module.exports = { PresentationBuilder };
