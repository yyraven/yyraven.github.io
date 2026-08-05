lab_theme <- theme_minimal() +
  theme(
    plot.title = element_text(hjust = 0.5, face = 'bold'),
    axis.line = element_line(linewidth = 0.5),
    axis.ticks = element_line(),
    panel.grid.major = element_blank(),
    panel.grid.minor = element_blank()
  )