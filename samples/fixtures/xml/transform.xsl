<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:t="https://example.com/codepen/theme"
                exclude-result-prefixes="t">
  <xsl:output method="html" indent="yes" />
  <xsl:param name="title" select="'CodePen Theme Original'" />

  <xsl:template match="/t:theme">
    <article class="theme-card" data-theme="{@id}">
      <h1><xsl:value-of select="$title" /></h1>
      <ul>
        <xsl:apply-templates select="t:palette/t:token">
          <xsl:sort select="@role" />
        </xsl:apply-templates>
      </ul>
    </article>
  </xsl:template>

  <xsl:template match="t:token">
    <li style="color: {@color}">
      <xsl:value-of select="concat(@role, ': ', @color)" />
      <xsl:if test="@italic = 'true'">
        <em> italic</em>
      </xsl:if>
    </li>
  </xsl:template>
</xsl:stylesheet>
