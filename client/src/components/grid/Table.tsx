import { FC, useEffect, useRef, useState } from 'react';
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import { TableType } from './Types';
import { Box, Button, Typography } from '@material-ui/core';
import EnhancedTableHead from './TableHead';
import { stableSort, getComparator } from './Utils';
import Copy from '../../components/copy/Copy';
import ActionBar from './ActionBar';
import LoadingTable from './LoadingTable';

const useStyles = makeStyles(theme => ({
  root: {
    // minHeight: '29vh',
    width: '100%',
    flexGrow: 1,
    flexBasis: 0,

    // change scrollbar style
    '&::-webkit-scrollbar': {
      width: '8px',
    },

    '&::-webkit-scrollbar-track': {
      backgroundColor: '#f9f9f9',
    },

    '&::-webkit-scrollbar-thumb': {
      borderRadius: '8px',
      backgroundColor: '#eee',
    },
  },
  box: {
    backgroundColor: '#fff',
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 750,
  },
  tableCell: {
    background: theme.palette.common.white,
    paddingLeft: theme.spacing(2),
  },
  checkbox: {
    background: theme.palette.common.white,
  },
  rowHover: {
    '&:hover': {
      backgroundColor: `#f3fcfe`,
      '& td': {
        background: 'inherit',
      },
    },
  },
  cell: {
    '& p': {
      display: 'inline-block',
      verticalAlign: 'middle',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: '300px',
      fontSize: '12.8px',
    },
    '& button': {
      textTransform: 'inherit',
      justifyContent: 'flex-start',
    },
    // '& svg': {
    //   color: 'rgba(0, 0, 0, 0.33)',
    // },
  },
  noData: {
    paddingTop: theme.spacing(6),
    textAlign: 'center',
    letterSpacing: '0.5px',
    color: 'rgba(0, 0, 0, 0.6)',
  },
}));

const EnhancedTable: FC<TableType> = props => {
  const {
    selected,
    onSelected,
    isSelected,
    onSelectedAll,
    rows = [],
    colDefinitions,
    primaryKey,
    openCheckBox = true,
    disableSelect,
    noData,
    showHoverStyle,
    isLoading,
  } = props;
  const classes = useStyles();
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState<string>('');
  const [tableMouseStatus, setTableMouseStatus] = React.useState<boolean[]>([]);
  const [loadingRowCount, setLoadingRowCount] = useState<number>(0);

  const containerRef = useRef(null);

  const handleRequestSort = (event: any, property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  useEffect(() => {
    const height: number = (containerRef.current as any)!.offsetHeight;
    // table header 57px, loading row 40px
    const count = Math.floor((height - 57) / 40);
    setLoadingRowCount(count);
  }, []);

  return (
    <TableContainer ref={containerRef} className={classes.root}>
      <Box height="100%" className={classes.box}>
        <Table
          stickyHeader
          className={classes.table}
          aria-labelledby="tableTitle"
          size="medium"
          aria-label="enhanced table"
        >
          <EnhancedTableHead
            colDefinitions={colDefinitions}
            numSelected={selected.length}
            order={order}
            orderBy={orderBy}
            onSelectAllClick={onSelectedAll}
            onRequestSort={handleRequestSort}
            rowCount={rows.length}
            openCheckBox={openCheckBox}
          />
          {!isLoading && (
            <TableBody>
              {rows && rows.length ? (
                stableSort(rows, getComparator(order, orderBy)).map(
                  (row, index) => {
                    const isItemSelected = isSelected(row);
                    const labelId = `enhanced-table-checkbox-${index}`;

                    const handleMouseEnter = () => {
                      setTableMouseStatus(v => {
                        const copy = [...v];
                        copy[index] = true;
                        return copy;
                      });
                    };
                    const handleMouseLeave = () =>
                      setTableMouseStatus(v => {
                        const copy = [...v];
                        copy[index] = false;
                        return copy;
                      });

                    return (
                      <TableRow
                        hover
                        key={'row' + row[primaryKey] + index}
                        onClick={event => onSelected(event, row)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        selected={isItemSelected && !disableSelect}
                        classes={
                          showHoverStyle ? { hover: classes.rowHover } : {}
                        }
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        {openCheckBox && (
                          <TableCell
                            padding="checkbox"
                            className={classes.checkbox}
                          >
                            <Checkbox
                              checked={isItemSelected}
                              color="primary"
                              inputProps={{ 'aria-labelledby': labelId }}
                            />
                          </TableCell>
                        )}

                        {colDefinitions.map((colDef, i) => {
                          const { actionBarConfigs = [], needCopy = false } =
                            colDef;
                          const cellStyle = colDef.getStyle
                            ? colDef.getStyle(row[colDef.id])
                            : {};
                          return colDef.showActionCell ? (
                            <TableCell
                              className={`${classes.cell} ${classes.tableCell}`}
                              key="manage"
                              style={cellStyle}
                            >
                              <ActionBar
                                showLabel={tableMouseStatus[index]}
                                configs={actionBarConfigs}
                                row={row}
                              ></ActionBar>
                            </TableCell>
                          ) : (
                            <TableCell
                              key={'cell' + row[primaryKey] + i}
                              padding={i === 0 ? 'none' : 'default'}
                              align={colDef.align || 'left'}
                              className={`${classes.cell} ${classes.tableCell}`}
                              style={cellStyle}
                            >
                              {row[colDef.id] &&
                              typeof row[colDef.id] === 'string' ? (
                                <Typography title={row[colDef.id]}>
                                  {colDef.onClick ? (
                                    <Button
                                      color="primary"
                                      data-data={row[colDef.id]}
                                      data-index={index}
                                      onClick={e => {
                                        colDef.onClick &&
                                          colDef.onClick(e, row);
                                      }}
                                    >
                                      {row[colDef.id]}
                                    </Button>
                                  ) : (
                                    row[colDef.id]
                                  )}
                                </Typography>
                              ) : (
                                <>
                                  {colDef.onClick ? (
                                    <Button
                                      color="primary"
                                      data-data={row[colDef.id]}
                                      data-index={index}
                                      onClick={e => {
                                        colDef.onClick &&
                                          colDef.onClick(e, row);
                                      }}
                                    >
                                      {row[colDef.id]}
                                    </Button>
                                  ) : (
                                    row[colDef.id]
                                  )}
                                </>
                              )}

                              {needCopy && row[colDef.id] && (
                                <Copy data={row[colDef.id]} />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    className={classes.noData}
                    colSpan={colDefinitions.length}
                  >
                    {noData}
                  </td>
                </tr>
              )}
            </TableBody>
          )}
        </Table>

        {isLoading && <LoadingTable count={loadingRowCount} />}
      </Box>
    </TableContainer>
  );
};

export default EnhancedTable;
