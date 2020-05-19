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

hoods %>%
  activate(nodes) %>%
  as_tibble() %>%
  st_as_sf() %>%
  ggplot(aes(fill = factor(group))) +
  geom_sf(colour = 'white', size = 0.1) +
  geom_sf(data = states_simplified, aes(), 
          fill = NA, colour = 'white', size = 0.5)

