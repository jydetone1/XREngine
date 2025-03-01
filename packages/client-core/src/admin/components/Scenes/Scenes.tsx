import React, { useEffect, useState } from 'react'
import Button from '@material-ui/core/Button'
import Checkbox from '@material-ui/core/Checkbox'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import Paper from '@material-ui/core/Paper'
import TablePagination from '@material-ui/core/TablePagination'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { selectAppState } from '../../../common/reducers/app/selector'
import { selectAuthState } from '../../../user/reducers/auth/selector'
import { PAGE_LIMIT } from '../../reducers/admin/reducers'
import { fetchAdminScenes } from '../../reducers/admin/scene/service'
import { fetchLocationTypes } from '../../reducers/admin/location/service'
// @ts-ignore
import styles from './Scenes.module.scss'
import AddToContentPackModal from '../ContentPack/AddToContentPackModal'
import { selectAdminSceneState } from '../../reducers/admin/scene/selector'

if (!global.setImmediate) {
  global.setImmediate = setTimeout as any
}

interface Props {
  authState?: any
  locationState?: any
  fetchAdminScenes?: any
  fetchLocationTypes?: any
  adminSceneState?: any
}

const mapStateToProps = (state: any): any => {
  return {
    appState: selectAppState(state),
    authState: selectAuthState(state),
    adminSceneState: selectAdminSceneState(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch): any => ({
  fetchAdminScenes: bindActionCreators(fetchAdminScenes, dispatch),
  fetchLocationTypes: bindActionCreators(fetchLocationTypes, dispatch)
})

const Scenes = (props: Props) => {
  const { authState, fetchAdminScenes, adminSceneState } = props

  const user = authState.get('user')
  const adminScenes = adminSceneState.get('scenes').get('scenes')
  const adminScenesCount = adminSceneState.get('scenes').get('total')

  const headCell = [
    { id: 'sid', numeric: false, disablePadding: true, label: 'ID' },
    { id: 'name', numeric: false, disablePadding: false, label: 'Name' },
    { id: 'description', numeric: false, disablePadding: false, label: 'Description' },
    { id: 'addToContentPack', numeric: false, disablePadding: false, label: 'Add to Content Pack' }
  ]

  function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
      return -1
    }
    if (b[orderBy] > a[orderBy]) {
      return 1
    }
    return 0
  }

  type Order = 'asc' | 'desc'

  function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key
  ): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy)
  }

  function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number])
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0])
      if (order !== 0) return order
      return a[1] - b[1]
    })
    return stabilizedThis.map((el) => el[0])
  }

  interface EnhancedTableProps {
    object: string
    numSelected: number
    onRequestSort: (event: React.MouseEvent<unknown>, property) => void
    onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void
    order: Order
    orderBy: string
    rowCount: number
  }

  function EnhancedTableHead(props: EnhancedTableProps) {
    const { object, order, orderBy, onRequestSort } = props
    const createSortHandler = (property) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property)
    }

    return (
      <TableHead className={styles.thead}>
        <TableRow className={styles.trow}>
          {headCell.map((headCell) => (
            <TableCell
              className={styles.tcell}
              key={headCell.id}
              align="right"
              padding={headCell.disablePadding ? 'none' : 'normal'}
              sortDirection={orderBy === headCell.id ? order : false}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    )
  }

  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<any>('name')
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_LIMIT)
  const [refetch, setRefetch] = useState(false)
  const [addToContentPackModalOpen, setAddToContentPackModalOpen] = useState(false)
  const [selectedScenes, setSelectedScenes] = useState([])

  const handleRequestSort = (event: React.MouseEvent<unknown>, property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = adminScenes.map((n) => n.name)
      setSelected(newSelecteds)
      return
    }
    setSelected([])
  }

  const handlePageChange = (event: unknown, newPage: number) => {
    const incDec = page < newPage ? 'increment' : 'decrement'
    fetchAdminScenes(incDec)
    setPage(newPage)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const fetchTick = () => {
    setTimeout(() => {
      setRefetch(true)
      fetchTick()
    }, 5000)
  }

  const handleCheck = (e: any, row: any) => {
    const existingSceneIndex = selectedScenes.findIndex((scene) => scene.id === row.id)
    if (e.target.checked === true) {
      if (existingSceneIndex >= 0) setSelectedScenes(selectedScenes.splice(existingSceneIndex, 1, row))
      else setSelectedScenes(selectedScenes.concat(row))
    } else setSelectedScenes(selectedScenes.splice(existingSceneIndex, 1))
  }

  useEffect(() => {
    fetchTick()
  }, [])

  useEffect(() => {
    if (user?.id != null && (adminSceneState.get('scenes').get('updateNeeded') === true || refetch === true)) {
      fetchAdminScenes()
    }
    setRefetch(false)
  }, [authState, adminSceneState, refetch])

  return (
    <div>
      <Paper className={styles.adminRoot}>
        <TableContainer className={styles.tableContainer}>
          <Table stickyHeader aria-labelledby="tableTitle" size={'medium'} aria-label="enhanced table">
            <EnhancedTableHead
              object={'scenes'}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={adminScenesCount || 0}
            />
            <TableBody className={styles.thead}>
              {stableSort(adminScenes, getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  return (
                    <TableRow
                      hover
                      className={styles.trowHover}
                      style={{ color: 'black !important' }}
                      // onClick={(event) => handleLocationClick(event, row.id.toString())}
                      tabIndex={-1}
                      key={row.id}
                    >
                      <TableCell
                        className={styles.tcell}
                        component="th"
                        id={row.id.toString()}
                        align="right"
                        scope="row"
                        padding="none"
                      >
                        {row.sid}
                      </TableCell>
                      <TableCell className={styles.tcell} align="right">
                        {row.name}
                      </TableCell>
                      <TableCell className={styles.tcell} align="right">
                        {row.description}
                      </TableCell>
                      <TableCell className={styles.tcell} align="right">
                        {user.userRole === 'admin' && (
                          <Checkbox
                            className={styles.checkbox}
                            onChange={(e) => handleCheck(e, row)}
                            name="stereoscopic"
                            color="primary"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </TableContainer>

        <div className={styles.tableFooter}>
          <TablePagination
            rowsPerPageOptions={[PAGE_LIMIT]}
            component="div"
            count={adminScenesCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            className={styles.tablePagination}
          />
        </div>
        <AddToContentPackModal
          open={addToContentPackModalOpen}
          scenes={selectedScenes}
          handleClose={() => setAddToContentPackModalOpen(false)}
        />
      </Paper>
      <Button
        className={styles['open-modal']}
        type="button"
        variant="contained"
        color="primary"
        onClick={() => setAddToContentPackModalOpen(true)}
      >
        Add to Content Pack
      </Button>
    </div>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(Scenes)
