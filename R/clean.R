library(sf)
library(tidyverse)
library(glue)
library(fs)

counties_simplified <- read_sf("data/map_data/projected-simplified-counties.geojson")

names <- 
  counties_simplified %>%
  st_drop_geometry() %>%
  mutate(name_o = glue("{name}, {state}")) %>%
  select(fips, state_fips, name_o)

data <- dir_ls("data/lex_data")

current <- data %>% magrittr::extract(str_detect(data, "county_lex")) %>% last()

lex <- 
  read_csv(current) %>%
  clean_names() %>%
  gather(fips, value, x01001:ncol(.)) %>%
  filter(value > 0) %>%
  mutate(fips = str_remove_all(fips, "x")) %>%
  left_join(counties_simplified) %>%
  st_as_sf()

lex %>%
  mutate(destination = fips) %>%
  select(county_pre, value, destination) %>%
  filter(value > 0) %>%
  rename(fips = county_pre) %>%
  st_drop_geometry() %>%
  left_join(names) %>%
  rename(origin = fips) %>%
  select(origin, destination, value) %>%
  write_csv("moves.csv")
