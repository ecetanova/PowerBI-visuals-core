﻿/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbitests {
    import CartesianChart = powerbi.visuals.CartesianChart;
    import DataView = powerbi.DataView;
    import DataViewTransform = powerbi.data.DataViewTransform;
    import mocks = powerbitests.mocks;
    import PrimitiveType = powerbi.PrimitiveType;
    import ValueType = powerbi.ValueType;
    import visuals = powerbi.visuals;

    powerbitests.mocks.setLocale();

    describe('CartesianChart', () => {
        let defaultChartType = visuals.plugins.columnChart.name;

        it('setData called on all layers when data changed', () => {
            let visual = new CartesianChartBuilder().build(visuals.plugins.lineStackedColumnComboChart.name);

            let dataViews = buildComboDataViews();
            // First onDataChanged initializes layers
            visual.onDataChanged({ dataViews: dataViews });

            let layers = getCartesianLayers(visual);
            expect(layers.length).toBe(2);

            let setDataSpy1 = spyOn(layers[0], 'setData');
            let setDataSpy2 = spyOn(layers[1], 'setData');

            visual.onDataChanged({ dataViews: dataViews });

            expect(setDataSpy1).toHaveBeenCalled();
            expect(setDataSpy2).toHaveBeenCalled();
        });

        it('viewport change does not trigger conversion', () => {
            let visual = new CartesianChartBuilder().build(defaultChartType);
            let dataView: DataView = buildSimpleDataView();
            
            visual.onDataChanged({ dataViews: [dataView] });

            let layers = getCartesianLayers(visual);
            let setDataSpy = spyOn(layers[0], 'setData');

            visual.onResizing({
                width: 200,
                height: 200,
            });

            expect(setDataSpy).not.toHaveBeenCalled();
        });

        describe('detectScalarMapping', () => {
            it('invalid data mapping', () => {
                expect(CartesianChart.detectScalarMapping(null)).toBe(false);

                expect(CartesianChart.detectScalarMapping({
                    metadata: {}
                })).toBe(false);

                expect(CartesianChart.detectScalarMapping({
                    metadata: {},
                    categorical: {}
                })).toBe(false);

                expect(CartesianChart.detectScalarMapping({
                    metadata: {},
                    categorical: {
                        categories: {
                            for: {
                                in: {
                                    role: 'Category',
                                    items: [],
                                }
                            }
                        }
                    }
                })).toBe(false);
            });

            it('ordinal value type', () => {
                expect(CartesianChart.detectScalarMapping({
                    metadata: {},
                    categorical: {
                        categories: {
                            for: {
                                in: {
                                    role: 'Category',
                                    items: [{
                                        type: ValueType.fromDescriptor({ text: true }),
                                        queryName: 'select1',
                                    }],
                                }
                            }
                        }
                    }
                })).toBe(false);
            });

            it('scalar value type', () => {
                expect(CartesianChart.detectScalarMapping({
                    metadata: {},
                    categorical: {
                        categories: {
                            for: {
                                in: {
                                    role: 'Category',
                                    items: [{
                                        type: ValueType.fromDescriptor({ numeric: true }),
                                        queryName: 'select1',
                                    }],
                                }
                            }
                        }
                    }
                })).toBe(true);
            });

            it('explicit scalar axisType', () => {
                expect(CartesianChart.detectScalarMapping({
                    metadata: {
                        objects: {
                            ['categoryAxis']: {
                                axisType: visuals.axisType.scalar
                            }
                        }
                    },
                    categorical: {
                        categories: {
                            for: {
                                in: {
                                    role: 'Category',
                                    items: [{
                                        type: ValueType.fromDescriptor({ text: true }),
                                        queryName: 'select1',
                                    }],
                                }
                            }
                        }
                    }
                })).toBe(false);
            });

            it('explicit categorical axisType overrides value type', () => {
                expect(CartesianChart.detectScalarMapping({
                    metadata: {
                        objects: {
                            ['categoryAxis']: {
                                axisType: visuals.axisType.categorical
                            }
                        }
                    },
                    categorical: {
                        categories: {
                            for: {
                                in: {
                                    role: 'Category',
                                    items: [{
                                        type: ValueType.fromDescriptor({ numeric: true }),
                                        queryName: 'select1',
                                    }],
                                }
                            }
                        }
                    }
                })).toBe(false);
            });
        });
    });

    function buildSimpleDataView(): DataView {
        let categories = ['abc', 'def'];
        let categoryIdentities = _.map(categories, (c) => mocks.dataViewScopeIdentity(c));
        let values = [1, 2];

        return <DataView> {
            metadata: {
                columns: [sampleData.categoryColumn, sampleData.valueColumn]
            },
            categorical: {
                categories: [{
                    source: sampleData.categoryColumn,
                    values: categories,
                    identity: categoryIdentities,
                }],
                values: DataViewTransform.createValueColumns([
                    {
                        source: sampleData.valueColumn,
                        values: values,
                    }
                ])
            }
        };
    }

    function buildComboDataViews(): DataView[] {
        let categories = ['abc', 'def'];
        let categoryIdentities = _.map(categories, (c) => mocks.dataViewScopeIdentity(c));
        let values1 = [1, 2];
        let values2 = [3, 4];

        return <DataView[]>[
            {
                metadata: {
                    columns: [sampleData.categoryColumn, sampleData.y1Column]
                },
                categorical: {
                    categories: [{
                        source: sampleData.categoryColumn,
                        values: categories,
                        identity: categoryIdentities,
                    }],
                    values: DataViewTransform.createValueColumns([
                        {
                            source: sampleData.y1Column,
                            values: values1,
                        }
                    ])
                }
            }, {
                metadata: {
                    columns: [sampleData.categoryColumn, sampleData.y2Column]
                },
                categorical: {
                    categories: [{
                        source: sampleData.categoryColumn,
                        values: categories,
                        identity: categoryIdentities,
                    }],
                    values: DataViewTransform.createValueColumns([
                        {
                            source: sampleData.y2Column,
                            values: values2,
                        }
                    ])
                }
            }
        ];
    }

    function getCartesianLayers(visual: CartesianChart): visuals.ICartesianVisual[] {
        return <visuals.ICartesianVisual[]>visual['layers'];
    }

    module sampleData {
        export let categoryColumn: powerbi.DataViewMetadataColumn = {
            displayName: 'categories',
            queryName: 'categories',
            type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Text),
            roles: { ['Category']: true },
        };

        export let valueColumn: powerbi.DataViewMetadataColumn = {
            displayName: 'values',
            queryName: 'values',
            isMeasure: true,
            type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double),
            roles: { ['Values']: true },
        };

        export let y1Column: powerbi.DataViewMetadataColumn = {
            displayName: 'y1',
            queryName: 'y1',
            isMeasure: true,
            type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double),
            roles: { ['Y']: true },
        };

        export let y2Column: powerbi.DataViewMetadataColumn = {
            displayName: 'y2',
            queryName: 'y2',
            isMeasure: true,
            type: ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double),
            roles: { ['Y2']: true },
        };
    }

    class CartesianChartBuilder {
        public visual: CartesianChart;
        public element: JQuery;
        public hostServices: powerbi.IVisualHostServices;
        public viewport: powerbi.IViewport;

        constructor(width: number = 500, height: number = 500) {
            this.viewport = {
                width: width,
                height: height,
            };

            this.hostServices = powerbitests.mocks.createVisualHostServices();
        }

        public build(chartType: string, interactiveChart: boolean = false): CartesianChart {
            this.element = powerbitests.helpers.testDom(this.viewport.width.toString(), this.viewport.height.toString());

            this.visual = <CartesianChart>powerbi.visuals.visualPluginFactory.create().getPlugin(chartType).create();
            this.visual.init({
                element: this.element,
                host: this.hostServices,
                style: powerbi.visuals.visualStyles.create(),
                viewport: {
                    height: this.viewport.height,
                    width: this.viewport.width
                },
                interactivity: { isInteractiveLegend: interactiveChart },
                animation: { transitionImmediate: true },
            });

            return this.visual;
        }
    }
}