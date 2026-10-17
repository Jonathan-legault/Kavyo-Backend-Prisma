import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type StoreModel = runtime.Types.Result.DefaultSelection<Prisma.$StorePayload>;
export type AggregateStore = {
    _count: StoreCountAggregateOutputType | null;
    _avg: StoreAvgAggregateOutputType | null;
    _sum: StoreSumAggregateOutputType | null;
    _min: StoreMinAggregateOutputType | null;
    _max: StoreMaxAggregateOutputType | null;
};
export type StoreAvgAggregateOutputType = {
    latitude: runtime.Decimal | null;
    longitude: runtime.Decimal | null;
};
export type StoreSumAggregateOutputType = {
    latitude: runtime.Decimal | null;
    longitude: runtime.Decimal | null;
};
export type StoreMinAggregateOutputType = {
    id: string | null;
    retailerId: string | null;
    name: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    latitude: runtime.Decimal | null;
    longitude: runtime.Decimal | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type StoreMaxAggregateOutputType = {
    id: string | null;
    retailerId: string | null;
    name: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    latitude: runtime.Decimal | null;
    longitude: runtime.Decimal | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type StoreCountAggregateOutputType = {
    id: number;
    retailerId: number;
    name: number;
    address: number;
    city: number;
    province: number;
    postalCode: number;
    latitude: number;
    longitude: number;
    isActive: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type StoreAvgAggregateInputType = {
    latitude?: true;
    longitude?: true;
};
export type StoreSumAggregateInputType = {
    latitude?: true;
    longitude?: true;
};
export type StoreMinAggregateInputType = {
    id?: true;
    retailerId?: true;
    name?: true;
    address?: true;
    city?: true;
    province?: true;
    postalCode?: true;
    latitude?: true;
    longitude?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type StoreMaxAggregateInputType = {
    id?: true;
    retailerId?: true;
    name?: true;
    address?: true;
    city?: true;
    province?: true;
    postalCode?: true;
    latitude?: true;
    longitude?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type StoreCountAggregateInputType = {
    id?: true;
    retailerId?: true;
    name?: true;
    address?: true;
    city?: true;
    province?: true;
    postalCode?: true;
    latitude?: true;
    longitude?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type StoreAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.StoreWhereInput;
    orderBy?: Prisma.StoreOrderByWithRelationInput | Prisma.StoreOrderByWithRelationInput[];
    cursor?: Prisma.StoreWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | StoreCountAggregateInputType;
    _avg?: StoreAvgAggregateInputType;
    _sum?: StoreSumAggregateInputType;
    _min?: StoreMinAggregateInputType;
    _max?: StoreMaxAggregateInputType;
};
export type GetStoreAggregateType<T extends StoreAggregateArgs> = {
    [P in keyof T & keyof AggregateStore]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateStore[P]> : Prisma.GetScalarType<T[P], AggregateStore[P]>;
};
export type StoreGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.StoreWhereInput;
    orderBy?: Prisma.StoreOrderByWithAggregationInput | Prisma.StoreOrderByWithAggregationInput[];
    by: Prisma.StoreScalarFieldEnum[] | Prisma.StoreScalarFieldEnum;
    having?: Prisma.StoreScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: StoreCountAggregateInputType | true;
    _avg?: StoreAvgAggregateInputType;
    _sum?: StoreSumAggregateInputType;
    _min?: StoreMinAggregateInputType;
    _max?: StoreMaxAggregateInputType;
};
export type StoreGroupByOutputType = {
    id: string;
    retailerId: string;
    name: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    latitude: runtime.Decimal | null;
    longitude: runtime.Decimal | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: StoreCountAggregateOutputType | null;
    _avg: StoreAvgAggregateOutputType | null;
    _sum: StoreSumAggregateOutputType | null;
    _min: StoreMinAggregateOutputType | null;
    _max: StoreMaxAggregateOutputType | null;
};
export type GetStoreGroupByPayload<T extends StoreGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<StoreGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof StoreGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], StoreGroupByOutputType[P]> : Prisma.GetScalarType<T[P], StoreGroupByOutputType[P]>;
}>>;
export type StoreWhereInput = {
    AND?: Prisma.StoreWhereInput | Prisma.StoreWhereInput[];
    OR?: Prisma.StoreWhereInput[];
    NOT?: Prisma.StoreWhereInput | Prisma.StoreWhereInput[];
    id?: Prisma.UuidFilter<"Store"> | string;
    retailerId?: Prisma.UuidFilter<"Store"> | string;
    name?: Prisma.StringNullableFilter<"Store"> | string | null;
    address?: Prisma.StringNullableFilter<"Store"> | string | null;
    city?: Prisma.StringNullableFilter<"Store"> | string | null;
    province?: Prisma.StringNullableFilter<"Store"> | string | null;
    postalCode?: Prisma.StringNullableFilter<"Store"> | string | null;
    latitude?: Prisma.DecimalNullableFilter<"Store"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.DecimalNullableFilter<"Store"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFilter<"Store"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Store"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Store"> | Date | string;
    priceObservations?: Prisma.PriceObservationListRelationFilter;
    retailer?: Prisma.XOR<Prisma.RetailerScalarRelationFilter, Prisma.RetailerWhereInput>;
};
export type StoreOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    retailerId?: Prisma.SortOrder;
    name?: Prisma.SortOrderInput | Prisma.SortOrder;
    address?: Prisma.SortOrderInput | Prisma.SortOrder;
    city?: Prisma.SortOrderInput | Prisma.SortOrder;
    province?: Prisma.SortOrderInput | Prisma.SortOrder;
    postalCode?: Prisma.SortOrderInput | Prisma.SortOrder;
    latitude?: Prisma.SortOrderInput | Prisma.SortOrder;
    longitude?: Prisma.SortOrderInput | Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    priceObservations?: Prisma.PriceObservationOrderByRelationAggregateInput;
    retailer?: Prisma.RetailerOrderByWithRelationInput;
};
export type StoreWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.StoreWhereInput | Prisma.StoreWhereInput[];
    OR?: Prisma.StoreWhereInput[];
    NOT?: Prisma.StoreWhereInput | Prisma.StoreWhereInput[];
    retailerId?: Prisma.UuidFilter<"Store"> | string;
    name?: Prisma.StringNullableFilter<"Store"> | string | null;
    address?: Prisma.StringNullableFilter<"Store"> | string | null;
    city?: Prisma.StringNullableFilter<"Store"> | string | null;
    province?: Prisma.StringNullableFilter<"Store"> | string | null;
    postalCode?: Prisma.StringNullableFilter<"Store"> | string | null;
    latitude?: Prisma.DecimalNullableFilter<"Store"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.DecimalNullableFilter<"Store"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFilter<"Store"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Store"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Store"> | Date | string;
    priceObservations?: Prisma.PriceObservationListRelationFilter;
    retailer?: Prisma.XOR<Prisma.RetailerScalarRelationFilter, Prisma.RetailerWhereInput>;
}, "id">;
export type StoreOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    retailerId?: Prisma.SortOrder;
    name?: Prisma.SortOrderInput | Prisma.SortOrder;
    address?: Prisma.SortOrderInput | Prisma.SortOrder;
    city?: Prisma.SortOrderInput | Prisma.SortOrder;
    province?: Prisma.SortOrderInput | Prisma.SortOrder;
    postalCode?: Prisma.SortOrderInput | Prisma.SortOrder;
    latitude?: Prisma.SortOrderInput | Prisma.SortOrder;
    longitude?: Prisma.SortOrderInput | Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.StoreCountOrderByAggregateInput;
    _avg?: Prisma.StoreAvgOrderByAggregateInput;
    _max?: Prisma.StoreMaxOrderByAggregateInput;
    _min?: Prisma.StoreMinOrderByAggregateInput;
    _sum?: Prisma.StoreSumOrderByAggregateInput;
};
export type StoreScalarWhereWithAggregatesInput = {
    AND?: Prisma.StoreScalarWhereWithAggregatesInput | Prisma.StoreScalarWhereWithAggregatesInput[];
    OR?: Prisma.StoreScalarWhereWithAggregatesInput[];
    NOT?: Prisma.StoreScalarWhereWithAggregatesInput | Prisma.StoreScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"Store"> | string;
    retailerId?: Prisma.UuidWithAggregatesFilter<"Store"> | string;
    name?: Prisma.StringNullableWithAggregatesFilter<"Store"> | string | null;
    address?: Prisma.StringNullableWithAggregatesFilter<"Store"> | string | null;
    city?: Prisma.StringNullableWithAggregatesFilter<"Store"> | string | null;
    province?: Prisma.StringNullableWithAggregatesFilter<"Store"> | string | null;
    postalCode?: Prisma.StringNullableWithAggregatesFilter<"Store"> | string | null;
    latitude?: Prisma.DecimalNullableWithAggregatesFilter<"Store"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.DecimalNullableWithAggregatesFilter<"Store"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolWithAggregatesFilter<"Store"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Store"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Store"> | Date | string;
};
export type StoreCreateInput = {
    id?: string;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    latitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    priceObservations?: Prisma.PriceObservationCreateNestedManyWithoutStoreInput;
    retailer: Prisma.RetailerCreateNestedOneWithoutStoresInput;
};
export type StoreUncheckedCreateInput = {
    id?: string;
    retailerId: string;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    latitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    priceObservations?: Prisma.PriceObservationUncheckedCreateNestedManyWithoutStoreInput;
};
export type StoreUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    province?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    postalCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    latitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    priceObservations?: Prisma.PriceObservationUpdateManyWithoutStoreNestedInput;
    retailer?: Prisma.RetailerUpdateOneRequiredWithoutStoresNestedInput;
};
export type StoreUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    retailerId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    province?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    postalCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    latitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    priceObservations?: Prisma.PriceObservationUncheckedUpdateManyWithoutStoreNestedInput;
};
export type StoreCreateManyInput = {
    id?: string;
    retailerId: string;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    latitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type StoreUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    province?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    postalCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    latitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type StoreUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    retailerId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    province?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    postalCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    latitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type StoreListRelationFilter = {
    every?: Prisma.StoreWhereInput;
    some?: Prisma.StoreWhereInput;
    none?: Prisma.StoreWhereInput;
};
export type StoreOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type StoreCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    retailerId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    address?: Prisma.SortOrder;
    city?: Prisma.SortOrder;
    province?: Prisma.SortOrder;
    postalCode?: Prisma.SortOrder;
    latitude?: Prisma.SortOrder;
    longitude?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type StoreAvgOrderByAggregateInput = {
    latitude?: Prisma.SortOrder;
    longitude?: Prisma.SortOrder;
};
export type StoreMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    retailerId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    address?: Prisma.SortOrder;
    city?: Prisma.SortOrder;
    province?: Prisma.SortOrder;
    postalCode?: Prisma.SortOrder;
    latitude?: Prisma.SortOrder;
    longitude?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type StoreMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    retailerId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    address?: Prisma.SortOrder;
    city?: Prisma.SortOrder;
    province?: Prisma.SortOrder;
    postalCode?: Prisma.SortOrder;
    latitude?: Prisma.SortOrder;
    longitude?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type StoreSumOrderByAggregateInput = {
    latitude?: Prisma.SortOrder;
    longitude?: Prisma.SortOrder;
};
export type StoreScalarRelationFilter = {
    is?: Prisma.StoreWhereInput;
    isNot?: Prisma.StoreWhereInput;
};
export type StoreCreateNestedManyWithoutRetailerInput = {
    create?: Prisma.XOR<Prisma.StoreCreateWithoutRetailerInput, Prisma.StoreUncheckedCreateWithoutRetailerInput> | Prisma.StoreCreateWithoutRetailerInput[] | Prisma.StoreUncheckedCreateWithoutRetailerInput[];
    connectOrCreate?: Prisma.StoreCreateOrConnectWithoutRetailerInput | Prisma.StoreCreateOrConnectWithoutRetailerInput[];
    createMany?: Prisma.StoreCreateManyRetailerInputEnvelope;
    connect?: Prisma.StoreWhereUniqueInput | Prisma.StoreWhereUniqueInput[];
};
export type StoreUncheckedCreateNestedManyWithoutRetailerInput = {
    create?: Prisma.XOR<Prisma.StoreCreateWithoutRetailerInput, Prisma.StoreUncheckedCreateWithoutRetailerInput> | Prisma.StoreCreateWithoutRetailerInput[] | Prisma.StoreUncheckedCreateWithoutRetailerInput[];
    connectOrCreate?: Prisma.StoreCreateOrConnectWithoutRetailerInput | Prisma.StoreCreateOrConnectWithoutRetailerInput[];
    createMany?: Prisma.StoreCreateManyRetailerInputEnvelope;
    connect?: Prisma.StoreWhereUniqueInput | Prisma.StoreWhereUniqueInput[];
};
export type StoreUpdateManyWithoutRetailerNestedInput = {
    create?: Prisma.XOR<Prisma.StoreCreateWithoutRetailerInput, Prisma.StoreUncheckedCreateWithoutRetailerInput> | Prisma.StoreCreateWithoutRetailerInput[] | Prisma.StoreUncheckedCreateWithoutRetailerInput[];
    connectOrCreate?: Prisma.StoreCreateOrConnectWithoutRetailerInput | Prisma.StoreCreateOrConnectWithoutRetailerInput[];
    upsert?: Prisma.StoreUpsertWithWhereUniqueWithoutRetailerInput | Prisma.StoreUpsertWithWhereUniqueWithoutRetailerInput[];
    createMany?: Prisma.StoreCreateManyRetailerInputEnvelope;
    set?: Prisma.StoreWhereUniqueInput | Prisma.StoreWhereUniqueInput[];
    disconnect?: Prisma.StoreWhereUniqueInput | Prisma.StoreWhereUniqueInput[];
    delete?: Prisma.StoreWhereUniqueInput | Prisma.StoreWhereUniqueInput[];
    connect?: Prisma.StoreWhereUniqueInput | Prisma.StoreWhereUniqueInput[];
    update?: Prisma.StoreUpdateWithWhereUniqueWithoutRetailerInput | Prisma.StoreUpdateWithWhereUniqueWithoutRetailerInput[];
    updateMany?: Prisma.StoreUpdateManyWithWhereWithoutRetailerInput | Prisma.StoreUpdateManyWithWhereWithoutRetailerInput[];
    deleteMany?: Prisma.StoreScalarWhereInput | Prisma.StoreScalarWhereInput[];
};
export type StoreUncheckedUpdateManyWithoutRetailerNestedInput = {
    create?: Prisma.XOR<Prisma.StoreCreateWithoutRetailerInput, Prisma.StoreUncheckedCreateWithoutRetailerInput> | Prisma.StoreCreateWithoutRetailerInput[] | Prisma.StoreUncheckedCreateWithoutRetailerInput[];
    connectOrCreate?: Prisma.StoreCreateOrConnectWithoutRetailerInput | Prisma.StoreCreateOrConnectWithoutRetailerInput[];
    upsert?: Prisma.StoreUpsertWithWhereUniqueWithoutRetailerInput | Prisma.StoreUpsertWithWhereUniqueWithoutRetailerInput[];
    createMany?: Prisma.StoreCreateManyRetailerInputEnvelope;
    set?: Prisma.StoreWhereUniqueInput | Prisma.StoreWhereUniqueInput[];
    disconnect?: Prisma.StoreWhereUniqueInput | Prisma.StoreWhereUniqueInput[];
    delete?: Prisma.StoreWhereUniqueInput | Prisma.StoreWhereUniqueInput[];
    connect?: Prisma.StoreWhereUniqueInput | Prisma.StoreWhereUniqueInput[];
    update?: Prisma.StoreUpdateWithWhereUniqueWithoutRetailerInput | Prisma.StoreUpdateWithWhereUniqueWithoutRetailerInput[];
    updateMany?: Prisma.StoreUpdateManyWithWhereWithoutRetailerInput | Prisma.StoreUpdateManyWithWhereWithoutRetailerInput[];
    deleteMany?: Prisma.StoreScalarWhereInput | Prisma.StoreScalarWhereInput[];
};
export type StoreCreateNestedOneWithoutPriceObservationsInput = {
    create?: Prisma.XOR<Prisma.StoreCreateWithoutPriceObservationsInput, Prisma.StoreUncheckedCreateWithoutPriceObservationsInput>;
    connectOrCreate?: Prisma.StoreCreateOrConnectWithoutPriceObservationsInput;
    connect?: Prisma.StoreWhereUniqueInput;
};
export type StoreUpdateOneRequiredWithoutPriceObservationsNestedInput = {
    create?: Prisma.XOR<Prisma.StoreCreateWithoutPriceObservationsInput, Prisma.StoreUncheckedCreateWithoutPriceObservationsInput>;
    connectOrCreate?: Prisma.StoreCreateOrConnectWithoutPriceObservationsInput;
    upsert?: Prisma.StoreUpsertWithoutPriceObservationsInput;
    connect?: Prisma.StoreWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.StoreUpdateToOneWithWhereWithoutPriceObservationsInput, Prisma.StoreUpdateWithoutPriceObservationsInput>, Prisma.StoreUncheckedUpdateWithoutPriceObservationsInput>;
};
export type StoreCreateWithoutRetailerInput = {
    id?: string;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    latitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    priceObservations?: Prisma.PriceObservationCreateNestedManyWithoutStoreInput;
};
export type StoreUncheckedCreateWithoutRetailerInput = {
    id?: string;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    latitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    priceObservations?: Prisma.PriceObservationUncheckedCreateNestedManyWithoutStoreInput;
};
export type StoreCreateOrConnectWithoutRetailerInput = {
    where: Prisma.StoreWhereUniqueInput;
    create: Prisma.XOR<Prisma.StoreCreateWithoutRetailerInput, Prisma.StoreUncheckedCreateWithoutRetailerInput>;
};
export type StoreCreateManyRetailerInputEnvelope = {
    data: Prisma.StoreCreateManyRetailerInput | Prisma.StoreCreateManyRetailerInput[];
    skipDuplicates?: boolean;
};
export type StoreUpsertWithWhereUniqueWithoutRetailerInput = {
    where: Prisma.StoreWhereUniqueInput;
    update: Prisma.XOR<Prisma.StoreUpdateWithoutRetailerInput, Prisma.StoreUncheckedUpdateWithoutRetailerInput>;
    create: Prisma.XOR<Prisma.StoreCreateWithoutRetailerInput, Prisma.StoreUncheckedCreateWithoutRetailerInput>;
};
export type StoreUpdateWithWhereUniqueWithoutRetailerInput = {
    where: Prisma.StoreWhereUniqueInput;
    data: Prisma.XOR<Prisma.StoreUpdateWithoutRetailerInput, Prisma.StoreUncheckedUpdateWithoutRetailerInput>;
};
export type StoreUpdateManyWithWhereWithoutRetailerInput = {
    where: Prisma.StoreScalarWhereInput;
    data: Prisma.XOR<Prisma.StoreUpdateManyMutationInput, Prisma.StoreUncheckedUpdateManyWithoutRetailerInput>;
};
export type StoreScalarWhereInput = {
    AND?: Prisma.StoreScalarWhereInput | Prisma.StoreScalarWhereInput[];
    OR?: Prisma.StoreScalarWhereInput[];
    NOT?: Prisma.StoreScalarWhereInput | Prisma.StoreScalarWhereInput[];
    id?: Prisma.UuidFilter<"Store"> | string;
    retailerId?: Prisma.UuidFilter<"Store"> | string;
    name?: Prisma.StringNullableFilter<"Store"> | string | null;
    address?: Prisma.StringNullableFilter<"Store"> | string | null;
    city?: Prisma.StringNullableFilter<"Store"> | string | null;
    province?: Prisma.StringNullableFilter<"Store"> | string | null;
    postalCode?: Prisma.StringNullableFilter<"Store"> | string | null;
    latitude?: Prisma.DecimalNullableFilter<"Store"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.DecimalNullableFilter<"Store"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFilter<"Store"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Store"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Store"> | Date | string;
};
export type StoreCreateWithoutPriceObservationsInput = {
    id?: string;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    latitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    retailer: Prisma.RetailerCreateNestedOneWithoutStoresInput;
};
export type StoreUncheckedCreateWithoutPriceObservationsInput = {
    id?: string;
    retailerId: string;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    latitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type StoreCreateOrConnectWithoutPriceObservationsInput = {
    where: Prisma.StoreWhereUniqueInput;
    create: Prisma.XOR<Prisma.StoreCreateWithoutPriceObservationsInput, Prisma.StoreUncheckedCreateWithoutPriceObservationsInput>;
};
export type StoreUpsertWithoutPriceObservationsInput = {
    update: Prisma.XOR<Prisma.StoreUpdateWithoutPriceObservationsInput, Prisma.StoreUncheckedUpdateWithoutPriceObservationsInput>;
    create: Prisma.XOR<Prisma.StoreCreateWithoutPriceObservationsInput, Prisma.StoreUncheckedCreateWithoutPriceObservationsInput>;
    where?: Prisma.StoreWhereInput;
};
export type StoreUpdateToOneWithWhereWithoutPriceObservationsInput = {
    where?: Prisma.StoreWhereInput;
    data: Prisma.XOR<Prisma.StoreUpdateWithoutPriceObservationsInput, Prisma.StoreUncheckedUpdateWithoutPriceObservationsInput>;
};
export type StoreUpdateWithoutPriceObservationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    province?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    postalCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    latitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    retailer?: Prisma.RetailerUpdateOneRequiredWithoutStoresNestedInput;
};
export type StoreUncheckedUpdateWithoutPriceObservationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    retailerId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    province?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    postalCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    latitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type StoreCreateManyRetailerInput = {
    id?: string;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    latitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type StoreUpdateWithoutRetailerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    province?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    postalCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    latitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    priceObservations?: Prisma.PriceObservationUpdateManyWithoutStoreNestedInput;
};
export type StoreUncheckedUpdateWithoutRetailerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    province?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    postalCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    latitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    priceObservations?: Prisma.PriceObservationUncheckedUpdateManyWithoutStoreNestedInput;
};
export type StoreUncheckedUpdateManyWithoutRetailerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    province?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    postalCode?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    latitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    longitude?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type StoreCountOutputType = {
    priceObservations: number;
};
export type StoreCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    priceObservations?: boolean | StoreCountOutputTypeCountPriceObservationsArgs;
};
export type StoreCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreCountOutputTypeSelect<ExtArgs> | null;
};
export type StoreCountOutputTypeCountPriceObservationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PriceObservationWhereInput;
};
export type StoreSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    retailerId?: boolean;
    name?: boolean;
    address?: boolean;
    city?: boolean;
    province?: boolean;
    postalCode?: boolean;
    latitude?: boolean;
    longitude?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    priceObservations?: boolean | Prisma.Store$priceObservationsArgs<ExtArgs>;
    retailer?: boolean | Prisma.RetailerDefaultArgs<ExtArgs>;
    _count?: boolean | Prisma.StoreCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["store"]>;
export type StoreSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    retailerId?: boolean;
    name?: boolean;
    address?: boolean;
    city?: boolean;
    province?: boolean;
    postalCode?: boolean;
    latitude?: boolean;
    longitude?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    retailer?: boolean | Prisma.RetailerDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["store"]>;
export type StoreSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    retailerId?: boolean;
    name?: boolean;
    address?: boolean;
    city?: boolean;
    province?: boolean;
    postalCode?: boolean;
    latitude?: boolean;
    longitude?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    retailer?: boolean | Prisma.RetailerDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["store"]>;
export type StoreSelectScalar = {
    id?: boolean;
    retailerId?: boolean;
    name?: boolean;
    address?: boolean;
    city?: boolean;
    province?: boolean;
    postalCode?: boolean;
    latitude?: boolean;
    longitude?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type StoreOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "retailerId" | "name" | "address" | "city" | "province" | "postalCode" | "latitude" | "longitude" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["store"]>;
export type StoreInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    priceObservations?: boolean | Prisma.Store$priceObservationsArgs<ExtArgs>;
    retailer?: boolean | Prisma.RetailerDefaultArgs<ExtArgs>;
    _count?: boolean | Prisma.StoreCountOutputTypeDefaultArgs<ExtArgs>;
};
export type StoreIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    retailer?: boolean | Prisma.RetailerDefaultArgs<ExtArgs>;
};
export type StoreIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    retailer?: boolean | Prisma.RetailerDefaultArgs<ExtArgs>;
};
export type $StorePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Store";
    objects: {
        priceObservations: Prisma.$PriceObservationPayload<ExtArgs>[];
        retailer: Prisma.$RetailerPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        retailerId: string;
        name: string | null;
        address: string | null;
        city: string | null;
        province: string | null;
        postalCode: string | null;
        latitude: runtime.Decimal | null;
        longitude: runtime.Decimal | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["store"]>;
    composites: {};
};
export type StoreGetPayload<S extends boolean | null | undefined | StoreDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$StorePayload, S>;
export type StoreCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<StoreFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: StoreCountAggregateInputType | true;
};
export interface StoreDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Store'];
        meta: {
            name: 'Store';
        };
    };
    findUnique<T extends StoreFindUniqueArgs>(args: Prisma.SelectSubset<T, StoreFindUniqueArgs<ExtArgs>>): Prisma.Prisma__StoreClient<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends StoreFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, StoreFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__StoreClient<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends StoreFindFirstArgs>(args?: Prisma.SelectSubset<T, StoreFindFirstArgs<ExtArgs>>): Prisma.Prisma__StoreClient<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends StoreFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, StoreFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__StoreClient<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends StoreFindManyArgs>(args?: Prisma.SelectSubset<T, StoreFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends StoreCreateArgs>(args: Prisma.SelectSubset<T, StoreCreateArgs<ExtArgs>>): Prisma.Prisma__StoreClient<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends StoreCreateManyArgs>(args?: Prisma.SelectSubset<T, StoreCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends StoreCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, StoreCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends StoreDeleteArgs>(args: Prisma.SelectSubset<T, StoreDeleteArgs<ExtArgs>>): Prisma.Prisma__StoreClient<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends StoreUpdateArgs>(args: Prisma.SelectSubset<T, StoreUpdateArgs<ExtArgs>>): Prisma.Prisma__StoreClient<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends StoreDeleteManyArgs>(args?: Prisma.SelectSubset<T, StoreDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends StoreUpdateManyArgs>(args: Prisma.SelectSubset<T, StoreUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends StoreUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, StoreUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends StoreUpsertArgs>(args: Prisma.SelectSubset<T, StoreUpsertArgs<ExtArgs>>): Prisma.Prisma__StoreClient<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends StoreCountArgs>(args?: Prisma.Subset<T, StoreCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], StoreCountAggregateOutputType> : number>;
    aggregate<T extends StoreAggregateArgs>(args: Prisma.Subset<T, StoreAggregateArgs>): Prisma.PrismaPromise<GetStoreAggregateType<T>>;
    groupBy<T extends StoreGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: StoreGroupByArgs['orderBy'];
    } : {
        orderBy?: StoreGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, StoreGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStoreGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: StoreFieldRefs;
}
export interface Prisma__StoreClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    priceObservations<T extends Prisma.Store$priceObservationsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Store$priceObservationsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    retailer<T extends Prisma.RetailerDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.RetailerDefaultArgs<ExtArgs>>): Prisma.Prisma__RetailerClient<runtime.Types.Result.GetResult<Prisma.$RetailerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface StoreFieldRefs {
    readonly id: Prisma.FieldRef<"Store", 'String'>;
    readonly retailerId: Prisma.FieldRef<"Store", 'String'>;
    readonly name: Prisma.FieldRef<"Store", 'String'>;
    readonly address: Prisma.FieldRef<"Store", 'String'>;
    readonly city: Prisma.FieldRef<"Store", 'String'>;
    readonly province: Prisma.FieldRef<"Store", 'String'>;
    readonly postalCode: Prisma.FieldRef<"Store", 'String'>;
    readonly latitude: Prisma.FieldRef<"Store", 'Decimal'>;
    readonly longitude: Prisma.FieldRef<"Store", 'Decimal'>;
    readonly isActive: Prisma.FieldRef<"Store", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"Store", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Store", 'DateTime'>;
}
export type StoreFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelect<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    include?: Prisma.StoreInclude<ExtArgs> | null;
    where: Prisma.StoreWhereUniqueInput;
};
export type StoreFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelect<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    include?: Prisma.StoreInclude<ExtArgs> | null;
    where: Prisma.StoreWhereUniqueInput;
};
export type StoreFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelect<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    include?: Prisma.StoreInclude<ExtArgs> | null;
    where?: Prisma.StoreWhereInput;
    orderBy?: Prisma.StoreOrderByWithRelationInput | Prisma.StoreOrderByWithRelationInput[];
    cursor?: Prisma.StoreWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.StoreScalarFieldEnum | Prisma.StoreScalarFieldEnum[];
};
export type StoreFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelect<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    include?: Prisma.StoreInclude<ExtArgs> | null;
    where?: Prisma.StoreWhereInput;
    orderBy?: Prisma.StoreOrderByWithRelationInput | Prisma.StoreOrderByWithRelationInput[];
    cursor?: Prisma.StoreWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.StoreScalarFieldEnum | Prisma.StoreScalarFieldEnum[];
};
export type StoreFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelect<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    include?: Prisma.StoreInclude<ExtArgs> | null;
    where?: Prisma.StoreWhereInput;
    orderBy?: Prisma.StoreOrderByWithRelationInput | Prisma.StoreOrderByWithRelationInput[];
    cursor?: Prisma.StoreWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.StoreScalarFieldEnum | Prisma.StoreScalarFieldEnum[];
};
export type StoreCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelect<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    include?: Prisma.StoreInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.StoreCreateInput, Prisma.StoreUncheckedCreateInput>;
};
export type StoreCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.StoreCreateManyInput | Prisma.StoreCreateManyInput[];
    skipDuplicates?: boolean;
};
export type StoreCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    data: Prisma.StoreCreateManyInput | Prisma.StoreCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.StoreIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type StoreUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelect<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    include?: Prisma.StoreInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.StoreUpdateInput, Prisma.StoreUncheckedUpdateInput>;
    where: Prisma.StoreWhereUniqueInput;
};
export type StoreUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.StoreUpdateManyMutationInput, Prisma.StoreUncheckedUpdateManyInput>;
    where?: Prisma.StoreWhereInput;
    limit?: number;
};
export type StoreUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.StoreUpdateManyMutationInput, Prisma.StoreUncheckedUpdateManyInput>;
    where?: Prisma.StoreWhereInput;
    limit?: number;
    include?: Prisma.StoreIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type StoreUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelect<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    include?: Prisma.StoreInclude<ExtArgs> | null;
    where: Prisma.StoreWhereUniqueInput;
    create: Prisma.XOR<Prisma.StoreCreateInput, Prisma.StoreUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.StoreUpdateInput, Prisma.StoreUncheckedUpdateInput>;
};
export type StoreDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelect<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    include?: Prisma.StoreInclude<ExtArgs> | null;
    where: Prisma.StoreWhereUniqueInput;
};
export type StoreDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.StoreWhereInput;
    limit?: number;
};
export type Store$priceObservationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type StoreDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.StoreSelect<ExtArgs> | null;
    omit?: Prisma.StoreOmit<ExtArgs> | null;
    include?: Prisma.StoreInclude<ExtArgs> | null;
};
