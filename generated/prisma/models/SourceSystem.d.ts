import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type SourceSystemModel = runtime.Types.Result.DefaultSelection<Prisma.$SourceSystemPayload>;
export type AggregateSourceSystem = {
    _count: SourceSystemCountAggregateOutputType | null;
    _min: SourceSystemMinAggregateOutputType | null;
    _max: SourceSystemMaxAggregateOutputType | null;
};
export type SourceSystemMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    sourceType: string | null;
    baseUrl: string | null;
    licenseInfo: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type SourceSystemMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    sourceType: string | null;
    baseUrl: string | null;
    licenseInfo: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type SourceSystemCountAggregateOutputType = {
    id: number;
    name: number;
    sourceType: number;
    baseUrl: number;
    licenseInfo: number;
    isActive: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type SourceSystemMinAggregateInputType = {
    id?: true;
    name?: true;
    sourceType?: true;
    baseUrl?: true;
    licenseInfo?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type SourceSystemMaxAggregateInputType = {
    id?: true;
    name?: true;
    sourceType?: true;
    baseUrl?: true;
    licenseInfo?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type SourceSystemCountAggregateInputType = {
    id?: true;
    name?: true;
    sourceType?: true;
    baseUrl?: true;
    licenseInfo?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type SourceSystemAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SourceSystemWhereInput;
    orderBy?: Prisma.SourceSystemOrderByWithRelationInput | Prisma.SourceSystemOrderByWithRelationInput[];
    cursor?: Prisma.SourceSystemWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | SourceSystemCountAggregateInputType;
    _min?: SourceSystemMinAggregateInputType;
    _max?: SourceSystemMaxAggregateInputType;
};
export type GetSourceSystemAggregateType<T extends SourceSystemAggregateArgs> = {
    [P in keyof T & keyof AggregateSourceSystem]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateSourceSystem[P]> : Prisma.GetScalarType<T[P], AggregateSourceSystem[P]>;
};
export type SourceSystemGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SourceSystemWhereInput;
    orderBy?: Prisma.SourceSystemOrderByWithAggregationInput | Prisma.SourceSystemOrderByWithAggregationInput[];
    by: Prisma.SourceSystemScalarFieldEnum[] | Prisma.SourceSystemScalarFieldEnum;
    having?: Prisma.SourceSystemScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: SourceSystemCountAggregateInputType | true;
    _min?: SourceSystemMinAggregateInputType;
    _max?: SourceSystemMaxAggregateInputType;
};
export type SourceSystemGroupByOutputType = {
    id: string;
    name: string;
    sourceType: string;
    baseUrl: string | null;
    licenseInfo: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: SourceSystemCountAggregateOutputType | null;
    _min: SourceSystemMinAggregateOutputType | null;
    _max: SourceSystemMaxAggregateOutputType | null;
};
export type GetSourceSystemGroupByPayload<T extends SourceSystemGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<SourceSystemGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof SourceSystemGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], SourceSystemGroupByOutputType[P]> : Prisma.GetScalarType<T[P], SourceSystemGroupByOutputType[P]>;
}>>;
export type SourceSystemWhereInput = {
    AND?: Prisma.SourceSystemWhereInput | Prisma.SourceSystemWhereInput[];
    OR?: Prisma.SourceSystemWhereInput[];
    NOT?: Prisma.SourceSystemWhereInput | Prisma.SourceSystemWhereInput[];
    id?: Prisma.UuidFilter<"SourceSystem"> | string;
    name?: Prisma.StringFilter<"SourceSystem"> | string;
    sourceType?: Prisma.StringFilter<"SourceSystem"> | string;
    baseUrl?: Prisma.StringNullableFilter<"SourceSystem"> | string | null;
    licenseInfo?: Prisma.StringNullableFilter<"SourceSystem"> | string | null;
    isActive?: Prisma.BoolFilter<"SourceSystem"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"SourceSystem"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SourceSystem"> | Date | string;
    ingestBatches?: Prisma.IngestBatchListRelationFilter;
    priceObservations?: Prisma.PriceObservationListRelationFilter;
};
export type SourceSystemOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    sourceType?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    licenseInfo?: Prisma.SortOrderInput | Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    ingestBatches?: Prisma.IngestBatchOrderByRelationAggregateInput;
    priceObservations?: Prisma.PriceObservationOrderByRelationAggregateInput;
};
export type SourceSystemWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    name?: string;
    AND?: Prisma.SourceSystemWhereInput | Prisma.SourceSystemWhereInput[];
    OR?: Prisma.SourceSystemWhereInput[];
    NOT?: Prisma.SourceSystemWhereInput | Prisma.SourceSystemWhereInput[];
    sourceType?: Prisma.StringFilter<"SourceSystem"> | string;
    baseUrl?: Prisma.StringNullableFilter<"SourceSystem"> | string | null;
    licenseInfo?: Prisma.StringNullableFilter<"SourceSystem"> | string | null;
    isActive?: Prisma.BoolFilter<"SourceSystem"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"SourceSystem"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SourceSystem"> | Date | string;
    ingestBatches?: Prisma.IngestBatchListRelationFilter;
    priceObservations?: Prisma.PriceObservationListRelationFilter;
}, "id" | "name">;
export type SourceSystemOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    sourceType?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    licenseInfo?: Prisma.SortOrderInput | Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.SourceSystemCountOrderByAggregateInput;
    _max?: Prisma.SourceSystemMaxOrderByAggregateInput;
    _min?: Prisma.SourceSystemMinOrderByAggregateInput;
};
export type SourceSystemScalarWhereWithAggregatesInput = {
    AND?: Prisma.SourceSystemScalarWhereWithAggregatesInput | Prisma.SourceSystemScalarWhereWithAggregatesInput[];
    OR?: Prisma.SourceSystemScalarWhereWithAggregatesInput[];
    NOT?: Prisma.SourceSystemScalarWhereWithAggregatesInput | Prisma.SourceSystemScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"SourceSystem"> | string;
    name?: Prisma.StringWithAggregatesFilter<"SourceSystem"> | string;
    sourceType?: Prisma.StringWithAggregatesFilter<"SourceSystem"> | string;
    baseUrl?: Prisma.StringNullableWithAggregatesFilter<"SourceSystem"> | string | null;
    licenseInfo?: Prisma.StringNullableWithAggregatesFilter<"SourceSystem"> | string | null;
    isActive?: Prisma.BoolWithAggregatesFilter<"SourceSystem"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"SourceSystem"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"SourceSystem"> | Date | string;
};
export type SourceSystemCreateInput = {
    id?: string;
    name: string;
    sourceType: string;
    baseUrl?: string | null;
    licenseInfo?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    ingestBatches?: Prisma.IngestBatchCreateNestedManyWithoutSourceSystemInput;
    priceObservations?: Prisma.PriceObservationCreateNestedManyWithoutSourceSystemInput;
};
export type SourceSystemUncheckedCreateInput = {
    id?: string;
    name: string;
    sourceType: string;
    baseUrl?: string | null;
    licenseInfo?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    ingestBatches?: Prisma.IngestBatchUncheckedCreateNestedManyWithoutSourceSystemInput;
    priceObservations?: Prisma.PriceObservationUncheckedCreateNestedManyWithoutSourceSystemInput;
};
export type SourceSystemUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    licenseInfo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    ingestBatches?: Prisma.IngestBatchUpdateManyWithoutSourceSystemNestedInput;
    priceObservations?: Prisma.PriceObservationUpdateManyWithoutSourceSystemNestedInput;
};
export type SourceSystemUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    licenseInfo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    ingestBatches?: Prisma.IngestBatchUncheckedUpdateManyWithoutSourceSystemNestedInput;
    priceObservations?: Prisma.PriceObservationUncheckedUpdateManyWithoutSourceSystemNestedInput;
};
export type SourceSystemCreateManyInput = {
    id?: string;
    name: string;
    sourceType: string;
    baseUrl?: string | null;
    licenseInfo?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SourceSystemUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    licenseInfo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SourceSystemUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    licenseInfo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SourceSystemCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    sourceType?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    licenseInfo?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SourceSystemMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    sourceType?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    licenseInfo?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SourceSystemMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    sourceType?: Prisma.SortOrder;
    baseUrl?: Prisma.SortOrder;
    licenseInfo?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SourceSystemScalarRelationFilter = {
    is?: Prisma.SourceSystemWhereInput;
    isNot?: Prisma.SourceSystemWhereInput;
};
export type SourceSystemCreateNestedOneWithoutIngestBatchesInput = {
    create?: Prisma.XOR<Prisma.SourceSystemCreateWithoutIngestBatchesInput, Prisma.SourceSystemUncheckedCreateWithoutIngestBatchesInput>;
    connectOrCreate?: Prisma.SourceSystemCreateOrConnectWithoutIngestBatchesInput;
    connect?: Prisma.SourceSystemWhereUniqueInput;
};
export type SourceSystemUpdateOneRequiredWithoutIngestBatchesNestedInput = {
    create?: Prisma.XOR<Prisma.SourceSystemCreateWithoutIngestBatchesInput, Prisma.SourceSystemUncheckedCreateWithoutIngestBatchesInput>;
    connectOrCreate?: Prisma.SourceSystemCreateOrConnectWithoutIngestBatchesInput;
    upsert?: Prisma.SourceSystemUpsertWithoutIngestBatchesInput;
    connect?: Prisma.SourceSystemWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SourceSystemUpdateToOneWithWhereWithoutIngestBatchesInput, Prisma.SourceSystemUpdateWithoutIngestBatchesInput>, Prisma.SourceSystemUncheckedUpdateWithoutIngestBatchesInput>;
};
export type SourceSystemCreateNestedOneWithoutPriceObservationsInput = {
    create?: Prisma.XOR<Prisma.SourceSystemCreateWithoutPriceObservationsInput, Prisma.SourceSystemUncheckedCreateWithoutPriceObservationsInput>;
    connectOrCreate?: Prisma.SourceSystemCreateOrConnectWithoutPriceObservationsInput;
    connect?: Prisma.SourceSystemWhereUniqueInput;
};
export type SourceSystemUpdateOneRequiredWithoutPriceObservationsNestedInput = {
    create?: Prisma.XOR<Prisma.SourceSystemCreateWithoutPriceObservationsInput, Prisma.SourceSystemUncheckedCreateWithoutPriceObservationsInput>;
    connectOrCreate?: Prisma.SourceSystemCreateOrConnectWithoutPriceObservationsInput;
    upsert?: Prisma.SourceSystemUpsertWithoutPriceObservationsInput;
    connect?: Prisma.SourceSystemWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SourceSystemUpdateToOneWithWhereWithoutPriceObservationsInput, Prisma.SourceSystemUpdateWithoutPriceObservationsInput>, Prisma.SourceSystemUncheckedUpdateWithoutPriceObservationsInput>;
};
export type SourceSystemCreateWithoutIngestBatchesInput = {
    id?: string;
    name: string;
    sourceType: string;
    baseUrl?: string | null;
    licenseInfo?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    priceObservations?: Prisma.PriceObservationCreateNestedManyWithoutSourceSystemInput;
};
export type SourceSystemUncheckedCreateWithoutIngestBatchesInput = {
    id?: string;
    name: string;
    sourceType: string;
    baseUrl?: string | null;
    licenseInfo?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    priceObservations?: Prisma.PriceObservationUncheckedCreateNestedManyWithoutSourceSystemInput;
};
export type SourceSystemCreateOrConnectWithoutIngestBatchesInput = {
    where: Prisma.SourceSystemWhereUniqueInput;
    create: Prisma.XOR<Prisma.SourceSystemCreateWithoutIngestBatchesInput, Prisma.SourceSystemUncheckedCreateWithoutIngestBatchesInput>;
};
export type SourceSystemUpsertWithoutIngestBatchesInput = {
    update: Prisma.XOR<Prisma.SourceSystemUpdateWithoutIngestBatchesInput, Prisma.SourceSystemUncheckedUpdateWithoutIngestBatchesInput>;
    create: Prisma.XOR<Prisma.SourceSystemCreateWithoutIngestBatchesInput, Prisma.SourceSystemUncheckedCreateWithoutIngestBatchesInput>;
    where?: Prisma.SourceSystemWhereInput;
};
export type SourceSystemUpdateToOneWithWhereWithoutIngestBatchesInput = {
    where?: Prisma.SourceSystemWhereInput;
    data: Prisma.XOR<Prisma.SourceSystemUpdateWithoutIngestBatchesInput, Prisma.SourceSystemUncheckedUpdateWithoutIngestBatchesInput>;
};
export type SourceSystemUpdateWithoutIngestBatchesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    licenseInfo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    priceObservations?: Prisma.PriceObservationUpdateManyWithoutSourceSystemNestedInput;
};
export type SourceSystemUncheckedUpdateWithoutIngestBatchesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    licenseInfo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    priceObservations?: Prisma.PriceObservationUncheckedUpdateManyWithoutSourceSystemNestedInput;
};
export type SourceSystemCreateWithoutPriceObservationsInput = {
    id?: string;
    name: string;
    sourceType: string;
    baseUrl?: string | null;
    licenseInfo?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    ingestBatches?: Prisma.IngestBatchCreateNestedManyWithoutSourceSystemInput;
};
export type SourceSystemUncheckedCreateWithoutPriceObservationsInput = {
    id?: string;
    name: string;
    sourceType: string;
    baseUrl?: string | null;
    licenseInfo?: string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    ingestBatches?: Prisma.IngestBatchUncheckedCreateNestedManyWithoutSourceSystemInput;
};
export type SourceSystemCreateOrConnectWithoutPriceObservationsInput = {
    where: Prisma.SourceSystemWhereUniqueInput;
    create: Prisma.XOR<Prisma.SourceSystemCreateWithoutPriceObservationsInput, Prisma.SourceSystemUncheckedCreateWithoutPriceObservationsInput>;
};
export type SourceSystemUpsertWithoutPriceObservationsInput = {
    update: Prisma.XOR<Prisma.SourceSystemUpdateWithoutPriceObservationsInput, Prisma.SourceSystemUncheckedUpdateWithoutPriceObservationsInput>;
    create: Prisma.XOR<Prisma.SourceSystemCreateWithoutPriceObservationsInput, Prisma.SourceSystemUncheckedCreateWithoutPriceObservationsInput>;
    where?: Prisma.SourceSystemWhereInput;
};
export type SourceSystemUpdateToOneWithWhereWithoutPriceObservationsInput = {
    where?: Prisma.SourceSystemWhereInput;
    data: Prisma.XOR<Prisma.SourceSystemUpdateWithoutPriceObservationsInput, Prisma.SourceSystemUncheckedUpdateWithoutPriceObservationsInput>;
};
export type SourceSystemUpdateWithoutPriceObservationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    licenseInfo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    ingestBatches?: Prisma.IngestBatchUpdateManyWithoutSourceSystemNestedInput;
};
export type SourceSystemUncheckedUpdateWithoutPriceObservationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    baseUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    licenseInfo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    ingestBatches?: Prisma.IngestBatchUncheckedUpdateManyWithoutSourceSystemNestedInput;
};
export type SourceSystemCountOutputType = {
    ingestBatches: number;
    priceObservations: number;
};
export type SourceSystemCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    ingestBatches?: boolean | SourceSystemCountOutputTypeCountIngestBatchesArgs;
    priceObservations?: boolean | SourceSystemCountOutputTypeCountPriceObservationsArgs;
};
export type SourceSystemCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemCountOutputTypeSelect<ExtArgs> | null;
};
export type SourceSystemCountOutputTypeCountIngestBatchesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.IngestBatchWhereInput;
};
export type SourceSystemCountOutputTypeCountPriceObservationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PriceObservationWhereInput;
};
export type SourceSystemSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    sourceType?: boolean;
    baseUrl?: boolean;
    licenseInfo?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    ingestBatches?: boolean | Prisma.SourceSystem$ingestBatchesArgs<ExtArgs>;
    priceObservations?: boolean | Prisma.SourceSystem$priceObservationsArgs<ExtArgs>;
    _count?: boolean | Prisma.SourceSystemCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["sourceSystem"]>;
export type SourceSystemSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    sourceType?: boolean;
    baseUrl?: boolean;
    licenseInfo?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["sourceSystem"]>;
export type SourceSystemSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    sourceType?: boolean;
    baseUrl?: boolean;
    licenseInfo?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["sourceSystem"]>;
export type SourceSystemSelectScalar = {
    id?: boolean;
    name?: boolean;
    sourceType?: boolean;
    baseUrl?: boolean;
    licenseInfo?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type SourceSystemOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "sourceType" | "baseUrl" | "licenseInfo" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["sourceSystem"]>;
export type SourceSystemInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    ingestBatches?: boolean | Prisma.SourceSystem$ingestBatchesArgs<ExtArgs>;
    priceObservations?: boolean | Prisma.SourceSystem$priceObservationsArgs<ExtArgs>;
    _count?: boolean | Prisma.SourceSystemCountOutputTypeDefaultArgs<ExtArgs>;
};
export type SourceSystemIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type SourceSystemIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $SourceSystemPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "SourceSystem";
    objects: {
        ingestBatches: Prisma.$IngestBatchPayload<ExtArgs>[];
        priceObservations: Prisma.$PriceObservationPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        sourceType: string;
        baseUrl: string | null;
        licenseInfo: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["sourceSystem"]>;
    composites: {};
};
export type SourceSystemGetPayload<S extends boolean | null | undefined | SourceSystemDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload, S>;
export type SourceSystemCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<SourceSystemFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: SourceSystemCountAggregateInputType | true;
};
export interface SourceSystemDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['SourceSystem'];
        meta: {
            name: 'SourceSystem';
        };
    };
    findUnique<T extends SourceSystemFindUniqueArgs>(args: Prisma.SelectSubset<T, SourceSystemFindUniqueArgs<ExtArgs>>): Prisma.Prisma__SourceSystemClient<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends SourceSystemFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, SourceSystemFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__SourceSystemClient<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends SourceSystemFindFirstArgs>(args?: Prisma.SelectSubset<T, SourceSystemFindFirstArgs<ExtArgs>>): Prisma.Prisma__SourceSystemClient<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends SourceSystemFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, SourceSystemFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__SourceSystemClient<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends SourceSystemFindManyArgs>(args?: Prisma.SelectSubset<T, SourceSystemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends SourceSystemCreateArgs>(args: Prisma.SelectSubset<T, SourceSystemCreateArgs<ExtArgs>>): Prisma.Prisma__SourceSystemClient<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends SourceSystemCreateManyArgs>(args?: Prisma.SelectSubset<T, SourceSystemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends SourceSystemCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, SourceSystemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends SourceSystemDeleteArgs>(args: Prisma.SelectSubset<T, SourceSystemDeleteArgs<ExtArgs>>): Prisma.Prisma__SourceSystemClient<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends SourceSystemUpdateArgs>(args: Prisma.SelectSubset<T, SourceSystemUpdateArgs<ExtArgs>>): Prisma.Prisma__SourceSystemClient<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends SourceSystemDeleteManyArgs>(args?: Prisma.SelectSubset<T, SourceSystemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends SourceSystemUpdateManyArgs>(args: Prisma.SelectSubset<T, SourceSystemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends SourceSystemUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, SourceSystemUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends SourceSystemUpsertArgs>(args: Prisma.SelectSubset<T, SourceSystemUpsertArgs<ExtArgs>>): Prisma.Prisma__SourceSystemClient<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends SourceSystemCountArgs>(args?: Prisma.Subset<T, SourceSystemCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], SourceSystemCountAggregateOutputType> : number>;
    aggregate<T extends SourceSystemAggregateArgs>(args: Prisma.Subset<T, SourceSystemAggregateArgs>): Prisma.PrismaPromise<GetSourceSystemAggregateType<T>>;
    groupBy<T extends SourceSystemGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: SourceSystemGroupByArgs['orderBy'];
    } : {
        orderBy?: SourceSystemGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, SourceSystemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSourceSystemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: SourceSystemFieldRefs;
}
export interface Prisma__SourceSystemClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    ingestBatches<T extends Prisma.SourceSystem$ingestBatchesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SourceSystem$ingestBatchesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    priceObservations<T extends Prisma.SourceSystem$priceObservationsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SourceSystem$priceObservationsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface SourceSystemFieldRefs {
    readonly id: Prisma.FieldRef<"SourceSystem", 'String'>;
    readonly name: Prisma.FieldRef<"SourceSystem", 'String'>;
    readonly sourceType: Prisma.FieldRef<"SourceSystem", 'String'>;
    readonly baseUrl: Prisma.FieldRef<"SourceSystem", 'String'>;
    readonly licenseInfo: Prisma.FieldRef<"SourceSystem", 'String'>;
    readonly isActive: Prisma.FieldRef<"SourceSystem", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"SourceSystem", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"SourceSystem", 'DateTime'>;
}
export type SourceSystemFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelect<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    include?: Prisma.SourceSystemInclude<ExtArgs> | null;
    where: Prisma.SourceSystemWhereUniqueInput;
};
export type SourceSystemFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelect<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    include?: Prisma.SourceSystemInclude<ExtArgs> | null;
    where: Prisma.SourceSystemWhereUniqueInput;
};
export type SourceSystemFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelect<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    include?: Prisma.SourceSystemInclude<ExtArgs> | null;
    where?: Prisma.SourceSystemWhereInput;
    orderBy?: Prisma.SourceSystemOrderByWithRelationInput | Prisma.SourceSystemOrderByWithRelationInput[];
    cursor?: Prisma.SourceSystemWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SourceSystemScalarFieldEnum | Prisma.SourceSystemScalarFieldEnum[];
};
export type SourceSystemFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelect<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    include?: Prisma.SourceSystemInclude<ExtArgs> | null;
    where?: Prisma.SourceSystemWhereInput;
    orderBy?: Prisma.SourceSystemOrderByWithRelationInput | Prisma.SourceSystemOrderByWithRelationInput[];
    cursor?: Prisma.SourceSystemWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SourceSystemScalarFieldEnum | Prisma.SourceSystemScalarFieldEnum[];
};
export type SourceSystemFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelect<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    include?: Prisma.SourceSystemInclude<ExtArgs> | null;
    where?: Prisma.SourceSystemWhereInput;
    orderBy?: Prisma.SourceSystemOrderByWithRelationInput | Prisma.SourceSystemOrderByWithRelationInput[];
    cursor?: Prisma.SourceSystemWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SourceSystemScalarFieldEnum | Prisma.SourceSystemScalarFieldEnum[];
};
export type SourceSystemCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelect<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    include?: Prisma.SourceSystemInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SourceSystemCreateInput, Prisma.SourceSystemUncheckedCreateInput>;
};
export type SourceSystemCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.SourceSystemCreateManyInput | Prisma.SourceSystemCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SourceSystemCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    data: Prisma.SourceSystemCreateManyInput | Prisma.SourceSystemCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SourceSystemUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelect<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    include?: Prisma.SourceSystemInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SourceSystemUpdateInput, Prisma.SourceSystemUncheckedUpdateInput>;
    where: Prisma.SourceSystemWhereUniqueInput;
};
export type SourceSystemUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.SourceSystemUpdateManyMutationInput, Prisma.SourceSystemUncheckedUpdateManyInput>;
    where?: Prisma.SourceSystemWhereInput;
    limit?: number;
};
export type SourceSystemUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SourceSystemUpdateManyMutationInput, Prisma.SourceSystemUncheckedUpdateManyInput>;
    where?: Prisma.SourceSystemWhereInput;
    limit?: number;
};
export type SourceSystemUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelect<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    include?: Prisma.SourceSystemInclude<ExtArgs> | null;
    where: Prisma.SourceSystemWhereUniqueInput;
    create: Prisma.XOR<Prisma.SourceSystemCreateInput, Prisma.SourceSystemUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.SourceSystemUpdateInput, Prisma.SourceSystemUncheckedUpdateInput>;
};
export type SourceSystemDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelect<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    include?: Prisma.SourceSystemInclude<ExtArgs> | null;
    where: Prisma.SourceSystemWhereUniqueInput;
};
export type SourceSystemDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SourceSystemWhereInput;
    limit?: number;
};
export type SourceSystem$ingestBatchesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
    where?: Prisma.IngestBatchWhereInput;
    orderBy?: Prisma.IngestBatchOrderByWithRelationInput | Prisma.IngestBatchOrderByWithRelationInput[];
    cursor?: Prisma.IngestBatchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.IngestBatchScalarFieldEnum | Prisma.IngestBatchScalarFieldEnum[];
};
export type SourceSystem$priceObservationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelect<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    include?: Prisma.PriceObservationInclude<ExtArgs> | null;
    where?: Prisma.PriceObservationWhereInput;
    orderBy?: Prisma.PriceObservationOrderByWithRelationInput | Prisma.PriceObservationOrderByWithRelationInput[];
    cursor?: Prisma.PriceObservationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PriceObservationScalarFieldEnum | Prisma.PriceObservationScalarFieldEnum[];
};
export type SourceSystemDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SourceSystemSelect<ExtArgs> | null;
    omit?: Prisma.SourceSystemOmit<ExtArgs> | null;
    include?: Prisma.SourceSystemInclude<ExtArgs> | null;
};
