/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define(['N/search', 'N/runtime'], function(search, runtime) {
    var exports = {};
    const NO_TEXT_NEEDED = ['itemid', 'averagecost', 'cost', 'manufacturer', 'salesdescription', 'isinactive',
        'custitem2', 'custitem_ag_contract_term', 'externalid'];
    /**
     * ACTION 2
     * Boomi Process - NS ITEMS TO BMI
     * @param lastModified (Date)
     * @returns search result in {object}
     */

    var getItemData = function(lastModified) {
        var dataOut = [];
        var runtimeObj = runtime.getCurrentScript();
        var searchId = runtimeObj.getParameter({ name: 'custscript_items_to_bmi_search' });

        var savedSearch = search.load({
            id: searchId
        });

        if(lastModified) {
            var dateFilter = search.createFilter({
                name: 'lastmodifieddate',
                operator: search.Operator.AFTER,
                values: lastModified
            });

            savedSearch.filters.push(dateFilter);
        }

        // runs search and return paginated results
        var pagedResult = savedSearch.runPaged({
            pageSize: 200
        });

        // count search results
        var searchCount = pagedResult.count;
        // log results count
        log.debug({
            title: 'Search Result Count',
            details: searchCount
        });

        if(searchCount > 0) {
            // iterate pageRanges
            pagedResult.pageRanges.forEach(function(pageRange) {
                // fetch paged search results
                var fetchedResults = pagedResult.fetch({ index: pageRange.index });

                // iterate fetched search result
                fetchedResults.data.forEach(function(result) {
                    var tempObj = {};
                    result.columns.forEach(function(col) {
                        tempObj['internalId'] = result.id;
                        tempObj[col.name] = result.getValue({ name: col.name, join: col.join });
                        if(NO_TEXT_NEEDED.indexOf(col.name) == -1) {
                            tempObj[col.name + "_text"] = result.getText({ name: col.name, join: col.join});
                        }
                    });
                    dataOut.push(tempObj);
                });
            });

        } else {

            // if result is empty return this object.
            dataOut.push( { internalId: 'empty' } );
        }

        return dataOut;
    };

    exports.getItemData = getItemData;
    return exports;
});