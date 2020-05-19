library(tidyverse)
library(data.table)
library(dtplyr)
library(janitor)

lex <- 
  read_csv("data/lex_data/county_lex_2020-05-11.csv.gz") %>%
  clean_names() %>%
  gather(fips, value, x01001:ncol(.)) %>%
  filter(value > 0) %>%
  mutate(fips = str_remove_all(fips, "x"))

library(sf)
library(rmapshaper)

counties <- read_sf("https://github.com/asrenninger/exposure/raw/master/data/map_data/projected-geography.geojson")

counties_simplified <- ms_simplify(counties, 0.5)

states_simplified <- 
  counties_simplified %>%
  group_by(state) %>%
  summarise()

verts <-
  lex %>%
  drop_na() %>%
  distinct(county_pre) %>%
  rename(id = county_pre)

links <-
  lex %>%
  filter(county_pre != fips) %>%
  select(county_pre, fips, value) %>%
  rename(from = county_pre,
         to = fips,
         weight = value)

library(igraph)
library(tidygraph)

graph <- graph_from_data_frame(links, vertices = verts, directed = FALSE)

plot(graph,
     vertex.size = 0.1,
     vertex.label = '', 
     alpha = 0.5)

graph <- as_tbl_graph(graph)

hoods <- 
  graph %>%
  activate(nodes) %>%
  mutate(group = group_louvain()) %>%
  rename(fips = name) %>%
  left_join(counties_simplified)

theme_bm_legend <- function () {
  theme_void() + 
    theme(plot.background = element_rect(fill = 'black', colour = 'black'),
          panel.grid.major.x = element_blank(),
          panel.grid.major.y = element_blank(),
          panel.grid.minor.x = element_blank(),
          panel.grid.minor.y = element_blank(),
          axis.line.x = element_blank(),
          axis.line.y = element_blank(),
          axis.ticks.x = element_blank(),
          axis.ticks.y = element_blank(),
          axis.text.x = element_blank(),
          axis.text.y = element_blank(),
          legend.title = element_text(colour = 'grey50', angle = 270),
          legend.text = element_text(colour = 'white', angle = 270),
          plot.title = element_text(face = 'bold', colour = 'grey50'),
          plot.subtitle =  element_text(face = 'plain', colour = 'white', size = 15),
          panel.grid.major = element_line(size = NA), 
          panel.grid.minor = element_line(size = NA),
          legend.position = c(0.9, 0.25),
          plot.margin = margin(20, 20, 20, 20)
    )
  
}

guide_discrete <-
  guide_legend(direction = "vertical",
               keyheight = unit(5, units = "mm"),
               keywidth = unit(2, units = "mm"),
               title.position = 'right',
               label.position = 'left',
               title.hjust = 0.5,
               label.hjust = 1,
               ncol = 1,
               bycol = TRUE)

library(RColorBrewer)

hoods %>%
  activate(nodes) %>%
  as_tibble() %>%
  st_as_sf() %>%
  ggplot(aes(fill = factor(group))) +
  geom_sf(colour = 'white', size = 0.1) +
  geom_sf(data = states_simplified, aes(), 
          fill = NA, colour = 'white', size = 0.5) +
  scale_fill_brewer(palette = 'Paired', 
                    name = 'group', 
                    guide = guide_discrete) +
  theme_bm_legend()

