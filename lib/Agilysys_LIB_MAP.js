/**
* @NApiVersion 2.x
* @NModuleScope Public
*/

/**
 * Description: Purpose of this code is to load the search with filters (parameters)
 * and return the search result in object
 *
 */

define(['N/search', 'N/format', 'N/runtime'], function(search, format, runtime) {
    var exports = {};

    // Action 1 function
    var getPricingDataByVertical = function(verticalId, lastModified) {
        var dataOut = [];
        var scriptObj = runtime.getCurrentScript();
        var searchId = scriptObj.getParameter({ name: 'custscript_search_to_load' });

        var existingSearch = search.load({
            id: searchId
        });

        log.debug({
            title: 'Params before split',
            details: verticalId + ", " + lastModified
        });

        if(verticalId) {
            var verticalId = verticalId.split(',');

            var verticalFilter = search.createFilter({
                name: 'custrecord_e81_fld_5_vertical',
                operator: search.Operator.ANYOF,
                values: verticalId
            });
            existingSearch.filters.push(verticalFilter);
        }

        if(lastModified) {

            var dateFilter = search.createFilter({
                name: 'lastmodified',
                operator: search.Operator.AFTER,
                values: lastModified
            });
            existingSearch.filters.push(dateFilter);
        }

        var searchResult = existingSearch.runPaged();
        var searchCount = searchResult.count;
        log.debug({
                title: 'Search Count',
                details: searchCount
            });

        if(searchCount > 0){
            searchResult.pageRanges.forEach(function(pageRange) {
                // getting all search result
                var pagedSearch = searchResult.fetch({ index : pageRange.index });

                pagedSearch.data.forEach(function(result) {
                    // creating a each result in key-pair value object

                    var eachObj = {};
                    eachObj.empty = false;
                    eachObj.id = result.getValue({ name: 'id' });
                    eachObj.vertical_name = result.getText({ name: 'custrecord_e81_fld_5_vertical'});
                    eachObj.vertical_id = result.getValue({ name: 'custrecord_e81_fld_5_vertical' });
                    eachObj.subsidiary_name = result.getValue({ name: 'name', join: 'CUSTRECORD_E81_FLD_3_SUBSIDIARY' });
                    eachObj.subsidiary_id = result.getValue({ name: 'custrecord_e81_fld_3_subsidiary' });
                    eachObj.vsoe_esp_price = result.getValue({ name: 'custrecord_e81_vsoe_esp_price' });
                    eachObj.currency_iso_code = result.getValue({ name: 'symbol', join: 'CUSTRECORD_E81_FLD_4_CURRENCY' });
                    eachObj.itemId = result.getValue({ name: 'itemid', join: 'CUSTRECORD_E81_VSOE_ESP_ITEM' });
                    eachObj.externalId = result.getValue({ name: 'externalid', join: 'CUSTRECORD_E81_VSOE_ESP_ITEM' });
                    eachObj.fmv_version = result.getValue({ name: 'custrecord_e81_fld_6_ag_fmv_version' });
                    eachObj.lastmodified = result.getValue({ name: 'lastmodified' });

                    dataOut.push(eachObj);
                });
            });
        } else {
            var obj = {
                empty: true
            };
            dataOut.push(obj);
        }

        log.debug({
            title: 'Search Result Length',
            details: dataOut.length
        });
        return dataOut;
    };

    /**
     *  UTIL Functions
     */
    var formattedDate = function(dateInString) {
        return format.parse({
            value: dateInString,
            type: format.Type.DATETIME
        });
        //return format.format({ value: parsedDate, type: format.Type.DATE });
    };

    // exports function definitions
    exports.getPricingDataByVertical = getPricingDataByVertical;

    return exports;
});
