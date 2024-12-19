// A local search script with the help of
// [hexo-generator-search](https://github.com/PaicHyperionDev/hexo-generator-search)
// Copyright (C) 2015
// Joseph Pan <http://github.com/wzpan>
// Shuhao Mao <http://github.com/maoshuhao>
// This library is free software; you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation; either version 2.1 of the
// License, or (at your option) any later version.
//
// This library is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA
// 02110-1301 USA
//
// Modified by:
// Pieter Robberechts <http://github.com/probberechts>

/*exported searchFunc*/
const searchFunc = function(path, searchId, contentId) {

  function stripHtml(html) {
    html = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<figure[\s\S]*?<\/figure>|<\/div>|<\/li>|<li>|<\/ul>|<\/p>|<br\s*[\/]?>|<[^>]+>/gi, function(tag) {
      if (tag === '</div>' || tag === '</li>' || tag === '</ul>' || tag === '</p>' || tag === '<br>' || tag === '<br/>') {
        return '\n';
      } else if (tag === '<li>') {
        return '  *  ';
      } else {
        return '';
      }
    });
    return html;
  }

  function getAllCombinations(keywords) {
    let startIndex, endIndex, result = [];

    for (startIndex = 0; startIndex < keywords.length; startIndex++) {
        for (endIndex = startIndex + 1; endIndex < keywords.length + 1; endIndex++) {
            result.push(keywords.slice(startIndex, endIndex).join(" "));
        }
    }
    return result;
  }

  $.ajax({
    url: path,
    dataType: "xml",
    success: function(xmlResponse) {
      // get the contents from search data
      let data = $("entry", xmlResponse).map(function() {
        return {
          title: $("title", this).text(),
          content: $("content", this).text(),
          url: $("link", this).attr("href")
        };
      }).get();

      let $input = document.getElementById(searchId);
      if (!$input) { return; }
      let $resultContent = document.getElementById(contentId);

      $input.addEventListener("input", function(){
        let resultList = [];
        let keywords = getAllCombinations(this.value.trim().toLowerCase().split(" "))
          .sort(function(a,b) { return b.split(" ").length - a.split(" ").length; });
        $resultContent.innerHTML = "";
        if (this.value.trim().length <= 0) {
          return;
        }
        // perform local searching
        data.forEach(function(data) {
          let matches = 0;
          if (!data.title || data.title.trim() === "") {
            data.title = "Untitled";
          }
          let dataTitle = data.title.trim().toLowerCase();
          let dataContent = stripHtml(data.content.trim());
          let dataUrl = data.url;
          let indexTitle = -1;
          let indexContent = -1;
          let firstOccur = -1;
          // only match articles with not empty contents
          if (dataContent !== "") {
            keywords.forEach((keyword) => {
              indexTitle = dataTitle.indexOf(keyword);
              indexContent = dataContent.indexOf(keyword);

              if (indexTitle >= 0 || indexContent >= 0) {
                matches += 1;
                if (indexContent < 0) {
                  indexContent = 0;
                }
                if (firstOccur < 0) {
                  firstOccur = indexContent;
                }
              }
            });
          }
          // show search results
          if (matches > 0) {
            let searchResult = {};
            searchResult.rank = matches;
            searchResult.str = "<li><a href='"+ dataUrl +"' class='search-result-title'>"+ dataTitle +"</a>";
            if (firstOccur >= 0) {
              // cut out 100 characters
              let start = firstOccur - 20;
              let end = firstOccur + 80;

              if(start < 0){
                start = 0;
              }

              if(start == 0){
                end = 100;
              }

              if(end > dataContent.length){
                end = dataContent.length;
              }

              let matchContent = dataContent.substr(start, end);

              // highlight all keywords
              let regS = new RegExp(keywords.join("|"), "gi");
              matchContent = matchContent.replace(regS, function(keyword) {
                return "<em class=\"search-keyword\">"+keyword+"</em>";
              });

              searchResult.str += "<p class=\"search-result\">" + matchContent +"...</p>";
            }
            searchResult.str += "</li>";
            resultList.push(searchResult);
          }
        });
        resultList.sort(function(a, b) {
            return b.rank - a.rank;
        });
        let result ="<ul class=\"search-result-list\">";
        for (const element of resultList) {
          result += element.str;
        }
        result += "</ul>";
        $resultContent.innerHTML = result;
      });
    }
  });
};
