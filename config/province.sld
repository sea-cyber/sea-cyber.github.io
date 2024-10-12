<?xml version="1.0" encoding="utf-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld"  xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0">
  <NamedLayer>
    <Name>cite:AGRI_PROVINCE</Name>
    <UserStyle>
      <FeatureTypeStyle>
        <Rule>
          <MinScaleDenominator>4622333.68</MinScaleDenominator>
          <TextSymbolizer>
            <Label>
              <ogc:PropertyName>PROVINCE</ogc:PropertyName>
            </Label>
            <Font>
              <CssParameter name="font-family">微软雅黑</CssParameter>
              <CssParameter name="font-size">12</CssParameter>
              <CssParameter name="font-style">normal</CssParameter>
            </Font>
            <LabelPlacement>
              <PointPlacement>
                <AnchorPoint>
                  <AnchorPointX>0.5</AnchorPointX>
                  <AnchorPointY>0.5</AnchorPointY>
                </AnchorPoint>
              </PointPlacement>
            </LabelPlacement>
            <Fill>
              <CssParameter name="fill">#fefefe</CssParameter>
            </Fill>
            <VendorOption name="followLine">true</VendorOption>
          </TextSymbolizer>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#a4c700</CssParameter>
              <CssParameter name="fill-opacity">0</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#AA3300</CssParameter>
              <CssParameter name="stroke-width">2</CssParameter>
              <CssParameter name="stroke-opacity">1</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>





