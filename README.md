# exposure
measuring county-to-county migration flows

## Proposal

This project will create a web interface for understanding our interconnected world. Using data from mobile phones, this project will present the linkages between counties across the country so that users can get a picture of the risks from new outbreaks of the novel coronavirus to their communities. In drawing the lines of connection between communities and allowing interaction to interrogate those connections, users will better understand the spread of the virus.

## Problem / Question

The networked and connected nature of our world is under scrutiny, but the average person may not know just how linked communities are across the nation. This informational—educational?—application will answer for each user the question, "to where and to what degree is my community connected?" This will illustrate the deep dependencies of our modern world and allow users to see the mechanisms by which a virus can traverse the country. With an advanced pandemic, spreading within most communities, this may be worth little, but in the event that outbreaks continue through the year, understanding linkages can allow an individual to anticipate the threat of the virus going forward: if a city coupled to yours sees a rise, it may be prudent expect one at home sooner rather later.  

## The data

The raw for this comes from [here](https://github.com/COVIDExposureIndices/COVIDExposureIndices), and is a repository maintained by a team at Wharton and other universities. Borrowing from the metadata, we will use an exposure index that measures shared mobile phone users—expressed as a percent of the total in that county—between pairs of counties. "Among smartphones that pinged in a given county today, what share of those devices pinged in each county at least once during the previous 14 days? The daily county-level LEX is an approximately 2000-by-2000 matrix in which each cell reports, among devices that pinged today in the column county, the share of devices that pinged in the row county at least once during the previous 14 days."

## Technologies used

Each time the page loads, data will be queried and mapped, requiring a combination of jQuery and a mapping software. Because this project will leverage large datasets, it will be built on Mapbox GL. Mapbox provides a number of benefits, including the ability to create custom style—which we will use to create an Albers projection of the country, since our focus area is America and only America—and its system of loading a source *then* displaying the data, which may help with processing times. The size of the data, however, means that all processing will need to occur outside of JavaScript.  

## Design spec

#### User experience

The goal of this web application is to take a 2,000 by 2,000 matrix of counties and map the connections between them. Rather than plot a tangle of paths, a choropleth will do.  
- Any resident of one of the study counties
- This will take what might be a confusing matrix of data and make it visually comprensible
- The New York Times, years ago, did map of social media connections between counties

#### Layouts and visual design

Components:
- Top: Banner, which will update its title and summary information by map hover
- Mid: Map, which will adjust its fill based on the target county
- Bot: Section with additional information like top 10

## Anticipated difficulties

The biggest threat to this project will be complications with Mapbox, since we have not used it extensively and with the size of the data. It will require a way to query data prior to mapping it to save on computation.

## Missing pieces

Again, finding a way to manage large datasets is going to essential here.
